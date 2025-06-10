using Microsoft.EntityFrameworkCore;
using System.Data;
using GuardAuth = API.Shared.Utilities.CheckAuthorized;
using TCommonUtils = CommonUtils.CommonUtils.CommonUtils;
using SharedModels.Dtos;
using SharedModels.Models;
using API.Application.Interfaces.Repositories;
using API.Infrastructure.Data;

namespace API.Infrastructure.Data.Repositories
{
    public class MstStadiumTypeRespository : IMstStadiumTypeRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        public MstStadiumTypeRespository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ApiResponse<MstStadiumTypeModel>> GetAllStadiumType()
        {
            ApiResponse<MstStadiumTypeModel> apiResponse = new ApiResponse<MstStadiumTypeModel>();
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
            List<MstStadiumTypeModel> dataResult = new List<MstStadiumTypeModel>();

            dataResult = await _dbContext.MstStadiumTypes.AsNoTracking().Where(p => true).ToListAsync();

            apiResponse.DataList = dataResult;

            return apiResponse;

        }
    }
}
