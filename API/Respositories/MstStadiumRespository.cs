using API.Data;
using API.Dtos;
using API.IRespositories;
using API.Models;

using API.Interfaces;
using ClosedXML.Excel;
using ExcelDataReader;
using Microsoft.EntityFrameworkCore;
using System.Data;
using System.Reflection;
using System.Text.Json;
using GuardAuth = API.Middlewares.CheckAuthorized;
using TCommonUtils = API.CommonUtils.CommonUtils;

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
