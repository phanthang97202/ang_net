using angnet.Application.Interfaces.Services;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Http;
using angnet.Infrastructure.Data.UnitOfWork;

namespace angnet.Infrastructure.Data.Services
{
    public class SysMenuService : ISysMenuService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IAuditTrailService _auditTrailService;

        public SysMenuService(
                AppDbContext appDbContext
                , IHttpContextAccessor httpContextAccessor
                , IUnitOfWork unitOfWork
                , IAuditTrailService auditTrailService
            )
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
            _unitOfWork = unitOfWork;
            _auditTrailService = auditTrailService;
        }

        public async Task<ApiResponse<SysMenuTreeDto>> GetActiveTree()
        {
            ApiResponse<SysMenuTreeDto> apiResponse = new ApiResponse<SysMenuTreeDto>();

            // Không kiểm tra quyền: navbar ngoài trang chủ phục vụ cả khách chưa
            // đăng nhập (xem SysMenuController.GetActive - [AllowAnonymous]).
            List<SysMenuModel> menus = await _unitOfWork.SysMenuRespository.GetActiveOrdered();

            // Menu con của một menu cha đang tắt sẽ không nằm trong danh sách này,
            // nên BuildTree tự loại chúng - đúng ý: tắt cha là tắt cả nhóm.
            apiResponse.DataList = BuildTree(menus);

            return apiResponse;
        }

        public async Task<ApiResponse<SysMenuTreeDto>> GetAllTree()
        {
            ApiResponse<SysMenuTreeDto> apiResponse = new ApiResponse<SysMenuTreeDto>();

            // Phân quyền do controller lo: [Authorize(Policy = "sysparameter.view")].
            List<SysMenuModel> menus = await _unitOfWork.SysMenuRespository.GetAllOrdered();

            apiResponse.DataList = BuildTree(menus);

            return apiResponse;
        }

        public async Task<ApiResponse<SysMenuSaveDto>> Create(SysMenuSaveDto data)
        {
            ApiResponse<SysMenuSaveDto> apiResponse = new ApiResponse<SysMenuSaveDto>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(data, ref requestClient);

            // Phân quyền do controller lo: [Authorize(Policy = "sysparameter.create")].

            string menuId = TCommonUtils.PureString(data.MenuId);

            if (TCommonUtils.IsNullOrEmpty(menuId))
            {
                apiResponse.CatchException(false, "SysMenu_Create.MenuIdIsNotValid", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.TitleVi) || TCommonUtils.IsNullOrEmpty(data.TitleEn))
            {
                apiResponse.CatchException(false, "SysMenu_Create.TitleIsNotValid", requestClient);
                return apiResponse;
            }

            var (isExist, _) = await _unitOfWork.SysMenuRespository
                                    .CheckRecordExist<SysMenuModel>(x => x.MenuId == menuId);
            if (isExist)
            {
                apiResponse.CatchException(false, "SysMenu_Create.MenuHasAlreadyExists", requestClient);
                return apiResponse;
            }

            string? parentId = NormalizeParentId(data.ParentId);
            if (!await IsParentValid(parentId, apiResponse, requestClient, "SysMenu_Create"))
            {
                return apiResponse;
            }

            SysMenuModel entity = new SysMenuModel
            {
                MenuId = menuId,
                ParentId = parentId,
                TitleVi = TCommonUtils.PureString(data.TitleVi),
                TitleEn = TCommonUtils.PureString(data.TitleEn),
                Path = TCommonUtils.PureString(data.Path),
                Icon = TCommonUtils.PureString(data.Icon),
                SortOrder = data.SortOrder,
                FlagActive = data.FlagActive,
                CreatedDTime = TCommonUtils.DTimeNow(),
                UpdatedDTime = TCommonUtils.DTimeNow(),
            };

            await _unitOfWork.SysMenuRespository.Create(entity);
            await _dbContext.SaveChangesAsync();

            apiResponse.Data = data;

            // save logging
            await WriteAuditAsync(menuId, $"Đã tạo menu {menuId} ({entity.TitleVi})", null);

            return apiResponse;
        }

        public async Task<ApiResponse<SysMenuSaveDto>> Update(SysMenuSaveDto data)
        {
            ApiResponse<SysMenuSaveDto> apiResponse = new ApiResponse<SysMenuSaveDto>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(data, ref requestClient);

            // Phân quyền do controller lo: [Authorize(Policy = "sysparameter.update")].

            string menuId = TCommonUtils.PureString(data.MenuId);

            var (isExist, existing) = await _unitOfWork.SysMenuRespository
                                            .CheckRecordExist<SysMenuModel>(x => x.MenuId == menuId);
            if (!isExist)
            {
                apiResponse.CatchException(false, "SysMenu_Update.MenuIsNotExist", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.TitleVi) || TCommonUtils.IsNullOrEmpty(data.TitleEn))
            {
                apiResponse.CatchException(false, "SysMenu_Update.TitleIsNotValid", requestClient);
                return apiResponse;
            }

            string? parentId = NormalizeParentId(data.ParentId);

            // Không cho menu tự làm cha của chính nó: navbar dựng cây bằng đệ quy,
            // vòng lặp như vậy sẽ treo lúc render.
            if (parentId == menuId)
            {
                apiResponse.CatchException(false, "SysMenu_Update.MenuCannotBeItsOwnParent", requestClient);
                return apiResponse;
            }

            if (!await IsParentValid(parentId, apiResponse, requestClient, "SysMenu_Update"))
            {
                return apiResponse;
            }

            // Menu đang có con thì không được biến thành menu con: navbar chỉ vẽ 2
            // cấp, cháu sẽ không bao giờ hiện ra.
            if (parentId != null && await _unitOfWork.SysMenuRespository.CountChildren(menuId) > 0)
            {
                apiResponse.CatchException(false, "SysMenu_Update.MenuHasChildrenCannotBeChild", requestClient);
                return apiResponse;
            }

            object oldSnapshot = SnapshotOf(existing);

            SysMenuModel entity = new SysMenuModel
            {
                MenuId = existing.MenuId,
                ParentId = parentId,
                TitleVi = TCommonUtils.PureString(data.TitleVi),
                TitleEn = TCommonUtils.PureString(data.TitleEn),
                Path = TCommonUtils.PureString(data.Path),
                Icon = TCommonUtils.PureString(data.Icon),
                SortOrder = data.SortOrder,
                FlagActive = data.FlagActive,
                CreatedBy = existing.CreatedBy,
                CreatedDTime = existing.CreatedDTime,
                UpdatedDTime = TCommonUtils.DTimeNow(),
            };

            await _unitOfWork.SysMenuRespository.Update(entity
                                                        , x => x.ParentId
                                                        , x => x.TitleVi
                                                        , x => x.TitleEn
                                                        , x => x.Path
                                                        , x => x.Icon
                                                        , x => x.SortOrder
                                                        , x => x.FlagActive
                                                        , x => x.UpdatedDTime
                                                        );
            await _dbContext.SaveChangesAsync();

            apiResponse.Data = data;

            // save logging
            await WriteAuditAsync(menuId, $"Đã sửa menu {menuId} ({entity.TitleVi})", oldSnapshot);

            return apiResponse;
        }

        public async Task<ApiResponse<SysMenuSaveDto>> Delete(string menuId)
        {
            ApiResponse<SysMenuSaveDto> apiResponse = new ApiResponse<SysMenuSaveDto>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(menuId, ref requestClient);

            // Phân quyền do controller lo: [Authorize(Policy = "sysparameter.delete")].

            var (isExist, existing) = await _unitOfWork.SysMenuRespository
                                            .CheckRecordExist<SysMenuModel>(x => x.MenuId == menuId);
            if (!isExist)
            {
                apiResponse.CatchException(false, "SysMenu_Delete.MenuIsNotExist", requestClient);
                return apiResponse;
            }

            // Chụp trước khi xóa: sau khi Remove thì không còn gì để ghi lại.
            object oldSnapshot = SnapshotOf(existing);
            int childCount = await _unitOfWork.SysMenuRespository.CountChildren(menuId);

            // Khóa ngoại khai ON DELETE CASCADE nên xóa cha là mất luôn con.
            await _unitOfWork.SysMenuRespository.Delete(existing);
            await _dbContext.SaveChangesAsync();

            // save logging
            string extra = childCount > 0 ? $" (kèm {childCount} menu con)" : "";
            await WriteAuditAsync(menuId, $"Đã xóa menu {menuId} ({existing.TitleVi}){extra}", oldSnapshot);

            return apiResponse;
        }

        public async Task<ApiResponse<SysMenuSaveDto>> ToggleActive(string menuId, bool flagActive)
        {
            ApiResponse<SysMenuSaveDto> apiResponse = new ApiResponse<SysMenuSaveDto>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(new { menuId, flagActive }, ref requestClient);

            // Phân quyền do controller lo: [Authorize(Policy = "sysparameter.update")].

            var (isExist, existing) = await _unitOfWork.SysMenuRespository
                                            .CheckRecordExist<SysMenuModel>(x => x.MenuId == menuId);
            if (!isExist)
            {
                apiResponse.CatchException(false, "SysMenu_ToggleActive.MenuIsNotExist", requestClient);
                return apiResponse;
            }

            object oldSnapshot = SnapshotOf(existing);

            existing.FlagActive = flagActive;
            existing.UpdatedDTime = TCommonUtils.DTimeNow();

            await _unitOfWork.SysMenuRespository.Update(existing
                                                        , x => x.FlagActive
                                                        , x => x.UpdatedDTime
                                                        );
            await _dbContext.SaveChangesAsync();

            // save logging
            string action = flagActive ? "bật" : "tắt";
            await WriteAuditAsync(menuId, $"Đã {action} menu {menuId} ({existing.TitleVi})", oldSnapshot);

            return apiResponse;
        }

        // ----------------------------------------------------------------- helpers

        /// <summary>
        /// Gom danh sách phẳng thành cây 2 cấp. Menu con trỏ tới cha không có trong
        /// danh sách (cha đang tắt, hoặc dữ liệu lệch) thì bị bỏ qua - thà thiếu một
        /// mục còn hơn hiện ra một mục lạc lõng không thuộc nhóm nào.
        /// </summary>
        private static List<SysMenuTreeDto> BuildTree(List<SysMenuModel> menus)
        {
            List<SysMenuTreeDto> roots = menus.Where(m => m.ParentId == null)
                                              .Select(ToDto)
                                              .ToList();

            Dictionary<string, SysMenuTreeDto> rootById = roots.ToDictionary(r => r.MenuId);

            foreach (SysMenuModel child in menus.Where(m => m.ParentId != null))
            {
                if (rootById.TryGetValue(child.ParentId!, out SysMenuTreeDto? parent))
                {
                    parent.Children.Add(ToDto(child));
                }
            }

            return roots;
        }

        private static SysMenuTreeDto ToDto(SysMenuModel m)
        {
            return new SysMenuTreeDto
            {
                MenuId = m.MenuId,
                TitleVi = m.TitleVi,
                TitleEn = m.TitleEn,
                Path = m.Path,
                Icon = m.Icon,
                SortOrder = m.SortOrder,
                FlagActive = m.FlagActive,
            };
        }

        // Chuỗi rỗng từ client cũng coi là "không có cha": nz-select trả '' chứ
        // không trả null khi bỏ chọn.
        private static string? NormalizeParentId(string? parentId)
        {
            return TCommonUtils.IsNullOrEmpty(parentId ?? "") ? null : parentId!.Trim();
        }

        /// <summary>
        /// Cha phải tồn tại và bản thân phải là menu cấp 1 - navbar chỉ vẽ 2 cấp.
        /// </summary>
        private async Task<bool> IsParentValid(
            string? parentId,
            ApiResponse<SysMenuSaveDto> apiResponse,
            List<RequestClient> requestClient,
            string errorPrefix)
        {
            if (parentId == null)
            {
                return true;
            }

            var (parentExists, parent) = await _unitOfWork.SysMenuRespository
                                                .CheckRecordExist<SysMenuModel>(x => x.MenuId == parentId);
            if (!parentExists)
            {
                apiResponse.CatchException(false, $"{errorPrefix}.ParentIsNotExist", requestClient);
                return false;
            }

            if (parent.ParentId != null)
            {
                apiResponse.CatchException(false, $"{errorPrefix}.ParentMustBeTopLevel", requestClient);
                return false;
            }

            return true;
        }

        private static object SnapshotOf(SysMenuModel m)
        {
            return new
            {
                m.MenuId,
                m.ParentId,
                m.TitleVi,
                m.TitleEn,
                m.Path,
                m.Icon,
                m.SortOrder,
                m.FlagActive,
            };
        }

        // Ghi nhật ký thao tác. Bọc try/catch để ghi log hỏng không làm hỏng luôn
        // thao tác đã lưu thành công.
        private async Task WriteAuditAsync(string recordId, string description, object? oldValues)
        {
            try
            {
                await _auditTrailService.Create(new AuditTrailDto
                {
                    RecordId = recordId,
                    Description = description,
                    ChangedColumns = "",
                    OldValues = oldValues is null
                        ? ""
                        : System.Text.Json.JsonSerializer.Serialize(oldValues)
                });
            }
            catch
            {
                // Nuốt lỗi có chủ đích - xem giải thích ở trên.
            }
        }
    }
}
