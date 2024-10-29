using API.Data;
using API.Dtos;
using API.IRespositories;
using API.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using GuardAuth = API.Middlewares.CheckAuthorized;
using TCommonUtils = API.CommonUtils.CommonUtils;

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

        public bool CheckNewsCategoryExist(string key, ref NewsCategoryModel data)
        {
            NewsCategoryModel record = _dbContext.NewsCategory.Find(key);
            if (record is not null)
            {
                data = record;
                return true;
            }
            data = null;
            return false;
        }

        public bool CheckNewsExist(string key, ref NewsModel data)
        {
            NewsModel record = _dbContext.News.Find(key);
            if (record is not null)
            {
                data = record;
                return true;
            }
            data = null;
            return false;
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

        public async Task<ApiResponse<NewsModel>> Create(ClaimsPrincipal User, NewsDto data)
        {
            ApiResponse<NewsModel> apiResponse = new ApiResponse<NewsModel>();
            List<RequestClient> requestClient = new List<RequestClient>();

            //
            string currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (TCommonUtils.IsNullOrEmpty(currentUserId))
            {
                apiResponse.CatchException(false, "News_Create.UserNotFound", requestClient);
                return apiResponse;
            }

            //
            string NewsId = TCommonUtils.GenerateSlug(data.ShortTitle);
            string UserId = currentUserId;
            string CategoryNewsId = TCommonUtils.PureString(data.CategoryNewsId);
            string Slug = TCommonUtils.GenerateSlug(data.ShortTitle);
            string Thumbnail = TCommonUtils.PureString(data.Thumbnail);
            string ShortTitle = TCommonUtils.PureString(data.ShortTitle);
            string ShortDescription = TCommonUtils.PureString(data.ShortDescription);
            string ContentBody = data.ContentBody;
            DateTime CreatedDTime = DateTime.Now;
            DateTime UpdatedDTime = DateTime.Now;
            bool FlagActive = true;
            int ViewCount = 0;
            int ShareCount = 0;
            int LikeCount = 0;
            double AvgPoint = 0;

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(ShortTitle))
            {
                apiResponse.CatchException(false, "News_Create.ShortTitleIsNotValid", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(ShortDescription))
            {
                apiResponse.CatchException(false, "News_Create.ShortDescriptionIsNotValid", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(ContentBody))
            {
                apiResponse.CatchException(false, "News_Create.ContentBodyIsNotValid", requestClient);
                return apiResponse;
            }

            NewsCategoryModel objNewsCategory = new NewsCategoryModel();
            bool isExistRecordNewsCategory = CheckNewsCategoryExist(CategoryNewsId, ref objNewsCategory);

            if (!isExistRecordNewsCategory)
            {
                apiResponse.CatchException(false, "News_Create.NewsCategoryIsNotExist", requestClient);
                return apiResponse;
            }

            NewsModel objNews = new NewsModel();
            bool isExistRecordNews = CheckNewsExist(NewsId, ref objNews);

            if (isExistRecordNews)
            {
                apiResponse.CatchException(false, "News_Create.ShortTitleIsExist", requestClient);
                return apiResponse;
            }

            // Save temp hashtag
            List<HashTagNewsDto> lstHashTagNews = data.LstHashTagNews;
            List<HashTagNewsModel> saveDtHashTagNews = new List<HashTagNewsModel>();
            for (int i = 0; i < lstHashTagNews.Count; i++)
            {
                string HashTagNewId = TCommonUtils.PureString(lstHashTagNews[i].HashTagNewsName);
                HashTagNewsModel record = _dbContext.HashTagNews.Find(HashTagNewId);

                if (!(record is null))
                {
                    lstHashTagNews.Remove(new HashTagNewsDto
                    {
                        HashTagNewsName = HashTagNewId
                    });
                }
                else
                {
                    HashTagNewsModel hashTagNews = new HashTagNewsModel()
                    {
                        HashTagNewsId = HashTagNewId,
                        HashTagNewsName = HashTagNewId,
                        NewsId = NewsId,
                        FlagActive = true,
                        CreatedDTime = DateTime.Now,
                        UpdatedDTime = DateTime.Now,

                    };

                    saveDtHashTagNews.Add(hashTagNews);
                }
            }

            // Save News, HashTag, File into Database
            await _dbContext.News.AddAsync(new NewsModel
            {
                NewsId = NewsId,
                UserId = currentUserId,
                CategoryNewsId = CategoryNewsId,
                Slug = Slug,
                Thumbnail = Thumbnail,
                ShortTitle = ShortTitle,
                ShortDescription = ShortDescription,
                ContentBody = ContentBody,
                CreatedDTime = CreatedDTime,
                UpdatedDTime = UpdatedDTime,
                FlagActive = FlagActive,
                ViewCount = ViewCount,
                ShareCount = ShareCount,
                LikeCount = LikeCount,
                AvgPoint = AvgPoint
            });

            if (saveDtHashTagNews.Count > 0)
            {
                await _dbContext.HashTagNews.AddRangeAsync(saveDtHashTagNews);
            }

            await _dbContext.SaveChangesAsync();

            return apiResponse;
        }
    }
}
