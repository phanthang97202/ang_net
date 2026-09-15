using angnet.Application.Interfaces.Services;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using GuardAuth = angnet.Utility.CommonUtils.CheckAuthorized;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using angnet.Infrastructure.Data.UnitOfWork;

namespace angnet.Infrastructure.Data.Services
{
    public class SysPermissionService : ISysPermissionService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        private readonly IUnitOfWork _unitOfWork;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IAuditTrailService _auditTrailService;

        public SysPermissionService(
                AppDbContext appDbContext
                , IHttpContextAccessor httpContextAccessor
                , IUnitOfWork unitOfWork
                , RoleManager<IdentityRole> roleManager
                , IAuditTrailService auditTrailService
            )
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
            _unitOfWork = unitOfWork;
            _roleManager = roleManager;
            _auditTrailService = auditTrailService;
        }

        public async Task<ApiResponse<PermissionModuleDto>> GetCatalogue()
        {
            ApiResponse<PermissionModuleDto> apiResponse = new ApiResponse<PermissionModuleDto>();
            List<RequestClient> requestClient = new List<RequestClient>();

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            List<SysPermissionModel> permissions = await _unitOfWork.SysPermissionRespository.GetAllActiveOrdered();

            // Gom theo module, giữ nguyên thứ tự đã sắp từ repository.
            List<PermissionModuleDto> dataResponse = permissions
                .GroupBy(p => new { p.Module, p.ModuleNameVi, p.ModuleNameEn })
                .Select(g => new PermissionModuleDto
                {
                    Module = g.Key.Module,
                    ModuleNameVi = g.Key.ModuleNameVi,
                    ModuleNameEn = g.Key.ModuleNameEn,
                    Permissions = g.Select(p => new PermissionItemDto
                    {
                        PermissionCode = p.PermissionCode,
                        PermissionNameVi = p.PermissionNameVi,
                        PermissionNameEn = p.PermissionNameEn,
                        DescriptionVi = p.DescriptionVi,
                        DescriptionEn = p.DescriptionEn,
                        SortOrder = p.SortOrder
                    }).ToList()
                })
                .ToList();

            apiResponse.DataList = dataResponse;

            return apiResponse;
        }

        public async Task<ApiResponse<RolePermissionDto>> GetPermissionsOfRole(string roleId)
        {
            ApiResponse<RolePermissionDto> apiResponse = new ApiResponse<RolePermissionDto>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(roleId, ref requestClient);

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(roleId))
            {
                apiResponse.CatchException(false, "SysPermission_GetOfRole.RoleIdIsNotValid", requestClient);
                return apiResponse;
            }

            IdentityRole role = await _roleManager.FindByIdAsync(roleId);
            if (role is null)
            {
                apiResponse.CatchException(false, "SysPermission_GetOfRole.RoleIsNotExist", requestClient);
                return apiResponse;
            }

            List<string> permissions = await _unitOfWork.SysPermissionRespository.GetPermissionsOfRole(roleId);

            apiResponse.Data = new RolePermissionDto
            {
                RoleId = roleId,
                RoleName = role.Name ?? "",
                Permissions = permissions
            };

            return apiResponse;
        }

        public async Task<ApiResponse<RolePermissionDto>> UpdatePermissionsOfRole(RolePermissionUpdateDto data)
        {
            ApiResponse<RolePermissionDto> apiResponse = new ApiResponse<RolePermissionDto>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(data, ref requestClient);

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.RoleId))
            {
                apiResponse.CatchException(false, "SysPermission_UpdateOfRole.RoleIdIsNotValid", requestClient);
                return apiResponse;
            }

            IdentityRole role = await _roleManager.FindByIdAsync(data.RoleId);
            if (role is null)
            {
                apiResponse.CatchException(false, "SysPermission_UpdateOfRole.RoleIsNotExist", requestClient);
                return apiResponse;
            }

            List<string> requested = data.Permissions ?? new List<string>();

            // Chỉ nhận mã quyền có thật trong danh mục: client gửi mã lạ (gõ tay, hoặc
            // quyền đã bị gỡ khỏi danh mục) mà cứ lưu thì vai trò mang một quyền không
            // bao giờ khớp với endpoint nào - sai âm thầm, rất khó lần ra.
            List<SysPermissionModel> catalogue = await _unitOfWork.SysPermissionRespository.GetAllActiveOrdered();
            HashSet<string> validCodes = catalogue.Select(p => p.PermissionCode).ToHashSet();

            List<string> unknown = requested.Where(c => !validCodes.Contains(c)).ToList();
            if (unknown.Count > 0)
            {
                apiResponse.CatchException(false, "SysPermission_UpdateOfRole.PermissionIsNotExist", requestClient);
                return apiResponse;
            }

            List<string> oldPermissions = await _unitOfWork.SysPermissionRespository.GetPermissionsOfRole(data.RoleId);

            await _unitOfWork.SysPermissionRespository.ReplacePermissionsOfRole(data.RoleId, requested);
            await _dbContext.SaveChangesAsync();

            apiResponse.Data = new RolePermissionDto
            {
                RoleId = data.RoleId,
                RoleName = role.Name ?? "",
                Permissions = requested
            };

            // save logging
            await WriteAuditAsync(
                data.RoleId,
                $"Đã cập nhật quyền của vai trò {role.Name}: {oldPermissions.Count} -> {requested.Count} quyền",
                oldPermissions
            );

            return apiResponse;
        }

        // Ghi nhật ký thao tác. Bọc try/catch để ghi log hỏng không làm hỏng luôn thao
        // tác phân quyền đã lưu thành công.
        private async Task WriteAuditAsync(string recordId, string description, object oldValues)
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
