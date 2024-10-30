using API.Data;
using API.Dtos;
using API.IRespositories;
using API.Models;
using Microsoft.AspNetCore.Identity;
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
        private readonly UserManager<AppUser> _userManager;
        public NewsRespository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor, UserManager<AppUser> userManager)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
            _userManager = userManager;
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

        public async Task<ApiResponse<RPNewsDto>> Detail(string key)
        {
            ApiResponse<RPNewsDto> apiResponse = new ApiResponse<RPNewsDto>();
            List<RequestClient> requestClient = new List<RequestClient>();

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            // Validate input
            if (TCommonUtils.IsNullOrEmpty(key))
            {
                apiResponse.CatchException(false, "News_Detail.NewsIdIsNotValid", requestClient);
                return apiResponse;
            }

            NewsModel objNews = new NewsModel();
            bool isExistRecordNews = CheckNewsExist(key, ref objNews);

            if (!isExistRecordNews)
            {
                apiResponse.CatchException(false, "News_Detail.NewsIsNotExist", requestClient);
                return apiResponse;
            }

            // 
            RPNewsDto rsNews = new RPNewsDto();

            // Get detail News  
            AppUser userDetail = await _userManager.FindByIdAsync(objNews.UserId);

            NewsCategoryModel categoryDetail = await _dbContext.NewsCategory.FirstOrDefaultAsync(item => item.NewsCategoryId == objNews.CategoryNewsId);

            // Get HashTag of News
            List<HashTagNewsModel> dtHashTagNews = new List<HashTagNewsModel>();
            dtHashTagNews = _dbContext.HashTagNews.Where(item => item.NewsId == key).ToList();

            List<HashTagNewsDto> lstHashTagNews = dtHashTagNews.Select(i => new HashTagNewsDto
            {
                HashTagNewsName = i.HashTagNewsName
            }).ToList();

            // Get File of News
            List<RefFileNewsModel> dtRefFileNews = new List<RefFileNewsModel>();
            dtRefFileNews = _dbContext.RefFileNews.Where(item => item.NewsId == key).ToList();

            List<RefFileNewsDto> lstRefFileNews = dtRefFileNews.Select(i => new RefFileNewsDto
            {
                FileUrl = i.FileUrl
            }).ToList();

            // Get AvgPoint of News
            List<PointNewsModel> dtPointNews = _dbContext.PointNews.Where(i => i.NewsId == key).ToList();
            double avgPoint;
            if (dtPointNews.Count > 0)
            {
                avgPoint = dtPointNews.Average(i => i.Point);
            }
            else
            {
                avgPoint = 0;
            }

            // Get LikeCount of News

            // Get ShareCount of News

            // Get ViewCount of News


            //
            rsNews.NewsId = objNews.NewsId;
            rsNews.UserId = objNews.UserId;
            rsNews.UserName = userDetail.UserName;
            rsNews.CategoryNewsId = objNews.CategoryNewsId;
            rsNews.CategoryNewsName = categoryDetail.NewsCategoryName;
            rsNews.Slug = objNews.Slug;
            rsNews.Thumbnail = objNews.Thumbnail;
            rsNews.ShortTitle = objNews.ShortTitle;
            rsNews.ShortDescription = objNews.ShortDescription;
            rsNews.ContentBody = objNews.ContentBody;
            rsNews.CreatedDTime = objNews.CreatedDTime;
            rsNews.UpdatedDTime = objNews.UpdatedDTime;
            rsNews.FlagActive = objNews.FlagActive;
            rsNews.ViewCount = 0;
            rsNews.ShareCount = 0;
            rsNews.LikeCount = 0;
            rsNews.AvgPoint = avgPoint;
            rsNews.LstHashTagNews = lstHashTagNews;
            rsNews.LstRefFileNews = lstRefFileNews;

            apiResponse.Data = rsNews;

            return apiResponse;
        }

        public async Task<ApiResponse<NewsModel>> Create(ClaimsPrincipal User, NewsDto data)
        {
            #region // Preparing 
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
            #endregion

            #region // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }
            #endregion

            #region // Validate input
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
            #endregion

            #region // Save temp HashTagNews
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
            #endregion

            #region // Save temp RefFileNews
            List<RefFileNewsDto> lstRefFileNews = data.LstRefFileNews;
            List<RefFileNewsModel> saveDtRefFileNews = new List<RefFileNewsModel>();
            for (int i = 0; i < lstRefFileNews.Count; i++)
            {
                string RefFileNewsId = TCommonUtils.GenUniqueId();
                string FileUrl = lstRefFileNews[i].FileUrl;
                RefFileNewsModel record = _dbContext.RefFileNews.Find(RefFileNewsId);

                RefFileNewsModel refFileNews = new RefFileNewsModel()
                {
                    RefFileNewsId = RefFileNewsId,
                    NewsId = NewsId,
                    FileUrl = FileUrl,
                    FlagActive = true,
                    CreatedDTime = DateTime.Now,
                    UpdatedDTime = DateTime.Now,

                };
                saveDtRefFileNews.Add(refFileNews);
            }
            #endregion

            #region // Save News, HashTag, File into Database
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

            if (saveDtRefFileNews.Count > 0)
            {
                await _dbContext.RefFileNews.AddRangeAsync(saveDtRefFileNews);
            }

            await _dbContext.SaveChangesAsync();
            #endregion

            return apiResponse;
        }
    }
}
