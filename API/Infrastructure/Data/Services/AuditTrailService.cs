using API.Application.Interfaces.Services;
using TCommonUtils = CommonUtils.CommonUtils.CommonUtils;
using SharedModels.Dtos;
using SharedModels.Models;
using GuardAuth = API.Shared.Utilities.CheckAuthorized;
using System.Reflection;
using API.Application.Interfaces.Persistences;
using System.Text.Json.Serialization;
using System.Text.Json;
using SharedModels.Enums;

namespace API.Infrastructure.Data.Services
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

        public async Task<ApiResponse<AuditTrailModel>> Create(AuditTrailModel data)
        {
            ApiResponse<AuditTrailModel> apiResponse = new ApiResponse<AuditTrailModel>();

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
            
            var auditTrailDt = new AuditTrailModel
            {
                RecordId = data.RecordId,
                IPAddress = _httpContextAccessor.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown",
                RequestUrl = _httpContextAccessor.HttpContext.Request.Path.Value ?? "Unknown",
                //TrailType = _httpContextAccessor.HttpContext.Request.Method.ToUpper() ,
                Description = data.Description,
                ChangedColumns = data.ChangedColumns,
                OldValues = data.OldValues,
                NewValues = JsonSerializer.Serialize(requestClient),
                ChangedBy = _httpContextAccessor.HttpContext.User.Identity?.Name ?? "UNDEFINED",
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
