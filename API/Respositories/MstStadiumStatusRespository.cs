 
using API.Data; 
using API.IRespositories; 
using Microsoft.EntityFrameworkCore;
using System.Data;
using SharedModels.Dtos;
using SharedModels.Models;
using GuardAuth = API.Middlewares.CheckAuthorized;
using TCommonUtils = CommonUtils.CommonUtils.CommonUtils;

namespace API.Respositories
{
    public class MstStadiumStatusRespository : IMstStadiumStatusRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        public MstStadiumStatusRespository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ApiResponse<MstStadiumStatusModel>> GetAllStadiumStatus()
        { 
            ApiResponse<MstStadiumStatusModel> apiResponse = new ApiResponse<MstStadiumStatusModel>();
            List<RequestClient> requestClient = new List<RequestClient>();

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            //
            List<MstStadiumStatusModel> dataResult = new List<MstStadiumStatusModel>();

            dataResult = await _dbContext.MstStadiumStatuses.AsNoTracking().Where(p => true).ToListAsync();

            apiResponse.DataList = dataResult; 

            return apiResponse;
          
        }
    }
}
