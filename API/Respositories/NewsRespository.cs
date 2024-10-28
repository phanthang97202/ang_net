using API.Data;
using API.Dtos;
using API.IRespositories;
using API.Models;
using Microsoft.EntityFrameworkCore;
using TCommonUtils = API.CommonUtils.CommonUtils;
using GuardAuth = API.Middlewares.CheckAuthorized;

namespace API.Respositories
{
    public class NewsRespository : INewsRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        public NewsRespository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<ApiResponse<NewsModel>> Detail(string key)
        {
            ApiResponse<NewsModel> apiResponse = new ApiResponse<NewsModel>();
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
            NewsModel dataResult = new NewsModel();
            dataResult = await _dbContext.News.SingleOrDefaultAsync(p => p.NewsId == key);

            List<int> x = new List<int>() { };
            x.FirstOrDefault(p => p == 1);

            if (dataResult == null)
            {
                apiResponse.Data = default!;
                return apiResponse;
            }

            apiResponse.Data = dataResult;

            return apiResponse;
        }
    }
}
