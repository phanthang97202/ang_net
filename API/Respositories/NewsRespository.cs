using API.Data;
using API.Dtos;
using API.IRespositories;
using API.Models;
using Microsoft.EntityFrameworkCore;
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

        public Task<ApiResponse<NewsModel>> Create(NewsModel data)
        {
            throw new NotImplementedException();
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

        //public async Task<ApiResponse<NewsModel>> Create(NewsModel data)
        //{
        //    ApiResponse<NewsModel> apiResponse = new ApiResponse<NewsModel>();
        //    List<RequestClient> requestClient = new List<RequestClient>();

        //    // Check Permission
        //    string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        //    bool isAuthorized = GuardAuth.IsAuthorized(token);
        //    if (!isAuthorized)
        //    {
        //        apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
        //        return apiResponse;
        //    }

        //    if (TCommonUtils.IsNullOrEmpty((data.ProvinceCode)))
        //    {
        //        apiResponse.CatchException(false, "MstProvince_Create.ProvinceCodeIsNotValid", requestClient);
        //        return apiResponse;
        //    }

        //    NewsModel? _data = new NewsModel();
        //    bool isExistRecord = CheckRecordExist(data.ProvinceCode, ref _data);


        //    if (isExistRecord == true)
        //    {
        //        apiResponse.CatchException(false, "MstProvince_Create.ProvinceHasAlreadyExists", requestClient);
        //        return apiResponse;
        //    }

        //    if (string.IsNullOrEmpty(data.ProvinceName))
        //    {
        //        apiResponse.CatchException(false, "MstProvince_Create.ProvinceNameIsNotValid", requestClient);
        //        return apiResponse;
        //    }

        //    if (data.FlagActive == false)
        //    {
        //        data.FlagActive = true;
        //    }
        //    data.CreatedDTime = DateTime.Now;
        //    data.UpdatedDTime = DateTime.Now;

        //    await _dbContext.MstProvinces.AddAsync(data);
        //    await _dbContext.SaveChangesAsync();

        //    apiResponse.Data = data;

        //    return apiResponse;
        //}
    }
}
