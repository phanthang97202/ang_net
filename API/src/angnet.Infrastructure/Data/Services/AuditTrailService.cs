using angnet.Application.Interfaces.Services;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using GuardAuth = angnet.Utility.CommonUtils.CheckAuthorized;
using System.Reflection;
using angnet.Application.Interfaces.Persistences;
using System.Text.Json.Serialization;
using System.Text.Json;
using angnet.Domain.Enums;
using Microsoft.AspNetCore.Http;

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

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            List<AuditTrailModel> data = await _unitOfWork.AuditTrailRespository.GetAll<AuditTrailModel>();

            apiResponse.DataList = data;

            return apiResponse;
        }

        public async Task<ApiResponse<AuditTrailDto>> Create(AuditTrailDto data)
        {
            ApiResponse<AuditTrailDto> apiResponse = new ApiResponse<AuditTrailDto>();

            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(data, ref requestClient);

            PropertyInfo[] properties = data.GetType().GetProperties();
            foreach (PropertyInfo p in properties)
            {
                string key = p.Name;
                object value = p.GetValue(data);
                RequestClient rc = new RequestClient(key, value);
                requestClient.Add(rc);
            }

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
