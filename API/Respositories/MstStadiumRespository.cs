using API.Data; 
using API.IRespositories; 
using Microsoft.EntityFrameworkCore;
using System.Data; 
using GuardAuth = API.Middlewares.CheckAuthorized;
using SharedModels.Dtos;
using SharedModels.Models;
using TCommonUtils = CommonUtils.CommonUtils.CommonUtils;

namespace API.Respositories
{
    public class MstStadiumRespository : IMstStadiumRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        public MstStadiumRespository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ApiResponse<MstStadiumModel>> GetAllActive()
        {
            ApiResponse<MstStadiumModel> apiResponse = new ApiResponse<MstStadiumModel>();
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
            List<MstStadiumModel> dataResult = new List<MstStadiumModel>();

            dataResult = await _dbContext.MstStadiums.AsNoTracking().Where(p => true).ToListAsync();

            apiResponse.DataList = dataResult;

            return apiResponse;

        }
    }
}
