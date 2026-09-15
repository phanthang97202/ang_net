using angnet.Application.Interfaces.Services;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;
using TMappingData = angnet.Utility.CommonUtils.MappingData;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using GuardAuth = angnet.Utility.CommonUtils.CheckAuthorized;
using System.Reflection;
using angnet.Application.Interfaces.Persistences;
using System.Text.Json.Serialization;
using System.Text.Json;
using angnet.Domain.Enums;
using Microsoft.AspNetCore.Http;
using angnet.Infrastructure.Data.UnitOfWork;

namespace angnet.Infrastructure.Data.Services
{
    public class AuditTrailService : IAuditTrailService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        private readonly IUnitOfWork _unitOfWork;
        public AuditTrailService(
                AppDbContext appDbContext
                , IHttpContextAccessor httpContextAccessor
                , IUnitOfWork unitOfWork
            )
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<AuditTrailModel>> GetAllActive()
        {
            ApiResponse<AuditTrailModel> apiResponse = new ApiResponse<AuditTrailModel>();
            List<RequestClient> requestClient = new List<RequestClient>();

            //// Kiểm tra Client có ngắt kết nối call api không?
            //var cancellationToken = _httpContextAccessor.HttpContext.RequestAborted;

            // Không còn tự kiểm tra token ở đây: controller đã gắn
            // [Authorize(Policy = "audittrail.view")]. GuardAuth.IsAuthorized chỉ xác
            // minh chữ ký JWT hợp lệ chứ không biết người gọi là ai, nên giữ lại vừa
            // thừa vừa dễ gây hiểu nhầm là đã phân quyền xong.

            List<AuditTrailModel> data = await _unitOfWork.AuditTrailRespository.GetAll<AuditTrailModel>();

            apiResponse.DataList = data.OrderByDescending(i => i.ChangedDTime).ToList();

            return apiResponse;
        }

        public ApiResponse<AuditTrailModel> Search(int pageIndex, int pageSize, string keyword, string level, string trailType)
        {
            ApiResponse<AuditTrailModel> apiResponse = new ApiResponse<AuditTrailModel>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(new
            {
                pageIndex,
                pageSize,
                keyword,
                level,
                trailType
            }, ref requestClient);

            // Phân quyền do controller lo: [Authorize(Policy = "audittrail.view")].

            int _pageIndex = pageIndex > 0 ? pageIndex : 0;
            int _pageSize = pageSize > 0 ? pageSize : 20;

            (List<AuditTrailModel> dataResult, int itemCount) = _unitOfWork.AuditTrailRespository
                                                                    .Search(_pageIndex, _pageSize, keyword, level, trailType);

            PageInfo<AuditTrailModel> pageInfo = new PageInfo<AuditTrailModel>();
            pageInfo.PageIndex = _pageIndex;
            pageInfo.PageSize = _pageSize;
            pageInfo.PageCount = itemCount % _pageSize == 0 ? itemCount / _pageSize : itemCount / _pageSize + 1;
            pageInfo.ItemCount = itemCount;
            pageInfo.DataList = dataResult;

            apiResponse.objResult = pageInfo;

            return apiResponse;
        }

        public async Task<ApiResponse<AuditTrailDto>> Create(AuditTrailDto data)
        {
            ApiResponse<AuditTrailDto> apiResponse = new ApiResponse<AuditTrailDto>();

            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(data, ref requestClient);

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);

            // Validate
            EAuditTrailLevel level = data.Level;

            if (!Enum.IsDefined(typeof(EAuditTrailLevel), level))
            {
                level = EAuditTrailLevel.INFORMATION;
            }

            var auditTrailDt = new AuditTrailModel
            {
                RecordId = data.RecordId ?? "",
                IPAddress = _httpContextAccessor.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown",
                RequestUrl = _httpContextAccessor.HttpContext.Request.Path.Value ?? "Unknown",
                Level = level,
                TrailType = Enum.TryParse<EAuditTrailType>(
                            _httpContextAccessor.HttpContext.Request.Method,
                            true,
                            out var trailType
                        ) ? trailType : EAuditTrailType.GET, // hoặc một giá trị Enum mặc định bạn chọn

                Description = data.Description,
                ChangedColumns = data.ChangedColumns,
                OldValues = data.OldValues,
                NewValues = JsonSerializer.Serialize(requestClient),
                ChangedBy = _httpContextAccessor.HttpContext.User.Identity?.Name ?? "",
                ChangedDTime = TCommonUtils.DTimeNow(),
                IsRevoked = false

            };

            await _unitOfWork.AuditTrailRespository.Create(auditTrailDt);
            await _dbContext.SaveChangesAsync();

            apiResponse.Data = data;

            return apiResponse;
        }
    }
}
