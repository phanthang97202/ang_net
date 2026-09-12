using angnet.Application.Interfaces.Repositories;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using Dapper;
using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using System.Security.Claims;
using GuardAuth = angnet.Utility.CommonUtils.CheckAuthorized;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;
using TConstValue = angnet.Utility.CommonUtils.ConstValue;


namespace angnet.Infrastructure.Data.Repositories
{
    public class NewsRespository : CommonRespository, INewsRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IWebHostEnvironment _env;
        //private readonly IConnectionMultiplexer _connectionMultiplexer;
        private readonly AppDbContext _dbContext;
        private readonly UserManager<AppUser> _userManager;
        //private readonly string _connectionString;
        //private readonly IConfigurationRoot configuration = new ConfigurationBuilder()
        //                                .AddJsonFile("appsettings.json")
        //                                .Build();


        public NewsRespository(AppDbContext appDbContext
                                , IHttpContextAccessor httpContextAccessor
                                , UserManager<AppUser> userManager
                                , IWebHostEnvironment env
                                , IConnectionMultiplexer connectionMultiplexer) : base(connectionMultiplexer, httpContextAccessor, env)
        {
            _dbContext = appDbContext;
            //_connectionMultiplexer = connectionMultiplexer;
            _httpContextAccessor = httpContextAccessor;
            _userManager = userManager;
            _env = env;
            //_connectionString = configuration.GetSection("ConnectionStrings")["LocalDb"];
        }

        public bool CheckNewsCategoryExist(string newsId, ref NewsCategoryModel data)
        {
            NewsCategoryModel record = _dbContext.NewsCategory.AsNoTracking().FirstOrDefault(n => n.NewsCategoryId == newsId);
            if (record is not null)
            {
                data = record;
                return true;
            }
            data = null;
            return false;
        }

        /// <summary>
        /// Bài chưa xuất bản (FlagActive = false) chỉ Admin hoặc chính tác giả mới được xem.
        /// Truyền authorUserId = null khi chưa biết tác giả (vd lúc lọc danh sách) - khi đó
        /// chỉ Admin mới qua được.
        /// </summary>
        private bool CanViewUnpublished(string authorUserId)
        {
            ClaimsPrincipal user = _httpContextAccessor.HttpContext?.User;
            if (user?.Identity?.IsAuthenticated != true)
            {
                return false;
            }

            if (user.IsInRole("Admin"))
            {
                return true;
            }

            return !TCommonUtils.IsNullOrEmpty(authorUserId)
                   && user.FindFirstValue(ClaimTypes.NameIdentifier) == authorUserId;
        }

        public bool CheckNewsExist(string newsId, ref NewsModel data)
        {
            NewsModel record = _dbContext.News.AsNoTracking().FirstOrDefault(n => n.NewsId == newsId);
            if (record is not null)
            {
                data = record;
                return true;
            }
            data = null;
            return false;
        }

        public bool CheckLikeNewsExist(string newsId, string userId, ref LikeNewsModel data)
        {
            LikeNewsModel record = _dbContext.LikeNews.AsNoTracking().FirstOrDefault(i => i.NewsId == newsId && i.UserId == userId);
            if (record is not null)
            {
                data = record;
                return true;
            }
            data = null;
            return false;
        }

        public bool CheckPointNewsExist(string newsId, string userId, ref PointNewsModel data)
        {
            PointNewsModel record = _dbContext.PointNews.AsNoTracking().FirstOrDefault(i => i.NewsId == newsId && i.UserId == userId);
            if (record is not null)
            {
                data = record;
                return true;
            }
            data = null;
            return false;
        }

        public async Task<RPNewsDto> FactoryNewsRecord(NewsModel objNews, List<string> excludeFields)
        {
            // 
            RPNewsDto rsNews = new RPNewsDto();

            // Get detail News  
            AppUser userDetail = await _userManager.FindByIdAsync(objNews.UserId);

            NewsCategoryModel categoryDetail = await _dbContext.NewsCategory.AsNoTracking().FirstOrDefaultAsync(item => item.NewsCategoryId == objNews.CategoryNewsId);

            // Get HashTag of News
            List<HashTagNewsModel> dtHashTagNews = new List<HashTagNewsModel>();
            dtHashTagNews = _dbContext.HashTagNews.AsNoTracking().Where(item => item.NewsId == objNews.NewsId).ToList();

            List<HashTagNewsDto> lstHashTagNews = dtHashTagNews.Select(i => new HashTagNewsDto
            {
                HashTagNewsName = i.HashTagNewsName
            }).ToList();

            // Get File of News
            List<RefFileNewsModel> dtRefFileNews = new List<RefFileNewsModel>();
            dtRefFileNews = _dbContext.RefFileNews.AsNoTracking().Where(item => item.NewsId == objNews.NewsId).ToList();

            List<RefFileNewsDto> lstRefFileNews = dtRefFileNews.Select(i => new RefFileNewsDto
            {
                FileUrl = i.FileUrl
            }).ToList();

            // Get AvgPoint of News
            List<PointNewsModel> dtPointNews = _dbContext.PointNews.AsNoTracking().Where(i => i.NewsId == objNews.NewsId).ToList();
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
            List<LikeNewsModel> dtLikeNews = _dbContext.LikeNews.AsNoTracking().Where(i => i.NewsId == objNews.NewsId).ToList();
            int countLike;
            if (dtLikeNews.Count > 0)
            {
                countLike = dtLikeNews.Count();
            }
            else
            {
                countLike = 0;
            }

            // Estimated Reading Time 
            (int estimatedReadingTime, int wordCountContent) = TCommonUtils.CalculateReadingTime(objNews.ContentBody);
            //
            rsNews.NewsId = objNews.NewsId;
            rsNews.UserId = objNews.UserId;
            rsNews.UserName = userDetail.UserName;
            rsNews.FullName = userDetail.FullName;
            rsNews.Avatar = userDetail.Avatar;
            rsNews.CategoryNewsId = objNews.CategoryNewsId;
            rsNews.CategoryNewsName = categoryDetail.NewsCategoryName;
            rsNews.Slug = objNews.Slug;
            rsNews.Thumbnail = objNews.Thumbnail;
            rsNews.ShortTitle = objNews.ShortTitle;
            rsNews.ShortDescription = objNews.ShortDescription;
            rsNews.ContentBody = excludeFields.Contains("ContentBody") ? null : objNews.ContentBody;
            rsNews.CreatedDTime = objNews.CreatedDTime;
            rsNews.UpdatedDTime = objNews.UpdatedDTime;
            rsNews.FlagActive = objNews.FlagActive;
            rsNews.ViewCount = objNews.ViewCount; // Luôn luôn trễ hơn 1 lượt xem
            rsNews.ShareCount = 0;
            rsNews.LikeCount = countLike;
            rsNews.AvgPoint = avgPoint;
            rsNews.LstHashTagNews = lstHashTagNews;
            rsNews.LstRefFileNews = excludeFields.Contains("LstRefFileNews") ? null : lstRefFileNews;
            rsNews.EstimatedReadingTime = estimatedReadingTime;

            // 
            return rsNews;

        }

        /// <summary>
        /// Thứ tự trả về của Search. Mặc định (chuỗi rỗng hoặc giá trị lạ) là bài mới nhất
        /// trước, giữ nguyên hành vi cũ.
        /// </summary>
        private IOrderedQueryable<NewsModel> ApplySort(IQueryable<NewsModel> query, string sort)
        {
            switch (sort)
            {
                // Cột News.ViewCount được tăng mỗi lần gọi Detail nên đọc thẳng được.
                case "views":
                    return query.OrderByDescending(i => i.ViewCount)
                                .ThenByDescending(i => i.CreatedDTime);

                // Không dùng cột News.LikeCount: cột đó không có chỗ nào ghi vào (chỉ Reel
                // mới duy trì cột tương tự), like của bài viết nằm ở bảng LikeNews -
                // FactoryNewsRecord cũng đang đếm theo bảng đó nên sắp xếp phải khớp.
                case "likes":
                    return query.OrderByDescending(i => _dbContext.LikeNews.Count(l => l.NewsId == i.NewsId))
                                .ThenByDescending(i => i.CreatedDTime);

                default:
                    return query.OrderByDescending(i => i.CreatedDTime);
            }
        }

        public async Task<ApiResponse<RPNewsDto>> Search(int pageIndex, int pageSize, string keyword, string userId, string categoryId, bool onlyPublished = true, string hashTag = "", string sort = "")
        {
            ApiResponse<RPNewsDto> apiResponse = new ApiResponse<RPNewsDto>();
            List<RequestClient> requestClient = new List<RequestClient>();

            // onlyPublished do client truyền nên không tin được: bất kỳ ai cũng có thể gọi
            // ?onlyPublished=false để đọc bài nháp. Chỉ Admin (hoặc tác giả khi đang lọc đúng
            // bài của chính mình) mới được phép tắt bộ lọc này.
            if (!onlyPublished && !CanViewUnpublished(userId))
            {
                onlyPublished = true;
            }

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            //bool isAuthorized = GuardAuth.IsAuthorized(token);
            //if (!isAuthorized)
            //{
            //    apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
            //    return apiResponse;
            //}

            // 
            int _pageIndex = 0;
            int _pageSize = 10;
            string _keyword = TCommonUtils.ConvertLowerCase(keyword);
            string _userId = TCommonUtils.ConvertLowerCase(userId);
            string _categoryId = TCommonUtils.ConvertLowerCase(categoryId);
            string _hashTag = TCommonUtils.ConvertLowerCase(hashTag);
            string _sort = TCommonUtils.ConvertLowerCase(sort);

            if (pageIndex > 0)
            {
                _pageIndex = pageIndex;
            }

            if (pageSize > 0)
            {
                _pageSize = pageSize;
            }

            //
            List<NewsModel> dataResult = new List<NewsModel>();

            IQueryable<NewsModel> query;

            if (!TCommonUtils.IsNullOrEmpty(_keyword))
            {
                query = _dbContext.News.AsNoTracking()
                                     .Where(i =>
                                             i.ShortTitle.Trim().ToLower().Contains(_keyword)
                                             || i.ShortDescription.Trim().ToLower().Contains(_keyword)
                                     );
            }
            else if (!TCommonUtils.IsNullOrEmpty(_userId))
            {
                query = _dbContext.News.AsNoTracking()
                                     .Where(i =>
                                             i.UserId.Trim().ToLower() == _userId
                                     );
            }
            else if (!TCommonUtils.IsNullOrEmpty(_categoryId))
            {
                query = _dbContext.News.AsNoTracking()
                                     .Where(i =>
                                             i.CategoryNewsId.Trim().ToLower() == _categoryId
                                     );
            }
            else
            {
                query = _dbContext.News.AsNoTracking()
                                     .Where(i => true);
            }

            // Loc theo hashtag dat ngoai chuoi if/else o tren de no CONG DON voi cac
            // dieu kien kia thay vi loai tru nhau (vd: hashtag + danh muc).
            if (!TCommonUtils.IsNullOrEmpty(_hashTag))
            {
                IQueryable<string> newsIdsByHashTag = _dbContext.HashTagNews.AsNoTracking()
                                     .Where(h => h.HashTagNewsName.Trim().ToLower() == _hashTag)
                                     .Select(h => h.NewsId);

                query = query.Where(i => newsIdsByHashTag.Contains(i.NewsId));
            }

            if (onlyPublished)
            {
                query = query.Where(i => i.FlagActive);
            }

            int itemCount = query.ToList().Count;

            //
            List<RPNewsDto> dataResponse = new List<RPNewsDto>();
            List<string> excludeFields = new List<string>() { "ContentBody" };

            // Starting cache data in RedisCloud
            //string keyCached = TCommonUtils.GenerateUniqueCacheKey(userId, TConstValue.CACHEKEY_NEWS_DETAIL, newsId);
            // _sort phải nằm trong khoá cache: thiếu nó thì trang "Đọc nhiều" và
            // "Mới nhất" dùng chung một ô nhớ, ai gọi trước ghi kết quả gì thì
            // người sau nhận đúng cái đó dù đã đổi kiểu sắp xếp.
            string primaryKey = $"({pageIndex}, {pageSize}, {keyword}, {userId}, {categoryId}, {onlyPublished}, {hashTag}, {_sort})";
            string keyStoreManager = TConstValue.NewsRespository_Search;

            string fieldKey = GenerateUniqueCacheKey(keyStoreManager, primaryKey);
            string rsNewsCached = await GetFieldOfHashCacheAsync(keyStoreManager, fieldKey);

            if (rsNewsCached is null)
            {
                dataResult = ApplySort(query, _sort)
                              .Skip(_pageIndex * _pageSize)
                              .Take(_pageSize)
                              .ToList();
                foreach (var item in dataResult)
                {
                    RPNewsDto obj = await FactoryNewsRecord(item, excludeFields);
                    dataResponse.Add(obj);
                }
                string jsonDataResult = TCommonUtils.ConvertToJsonStringify(dataResponse);
                await HashCacheAsync(keyStoreManager, fieldKey, jsonDataResult);
            }
            else
            {
                List<RPNewsDto> parseDataResult = TCommonUtils.ParseJsonStringify<List<RPNewsDto>>(rsNewsCached);
                dataResponse = parseDataResult;
            }

            PageInfo<RPNewsDto> pageInfo = new PageInfo<RPNewsDto>();
            pageInfo.PageIndex = pageIndex;
            pageInfo.PageSize = pageSize;
            pageInfo.PageCount = itemCount % pageSize == 0 ? itemCount / pageSize : itemCount / pageSize + 1;
            pageInfo.ItemCount = itemCount;
            pageInfo.DataList = dataResponse ?? new List<RPNewsDto>();


            apiResponse.objResult = pageInfo;

            return apiResponse;
        }

        /// <summary>
        /// Mỗi danh mục gốc kèm tổng số bài và vài bài được đọc nhiều nhất, dùng cho
        /// khối "Khám phá theo chủ đề" ngoài trang chủ.
        ///
        /// Gộp tất cả vào một lần gọi thay vì để client bắn mỗi danh mục một request:
        /// blog đang có 9 danh mục, cứ mỗi lần mở trang chủ là 9 round-trip.
        /// </summary>
        public async Task<ApiResponse<NewsCategoryPreviewDto>> CategoryPreview(int take)
        {
            ApiResponse<NewsCategoryPreviewDto> apiResponse = new ApiResponse<NewsCategoryPreviewDto>();

            // take do client truyền: chặn trên để một request lỡ tay không kéo về cả blog.
            int _take = (take > 0 && take <= 10) ? take : 3;

            // Nội dung giống hệt nhau với mọi khách nên cache được nguyên khối. Vòng lặp
            // bên dưới chạy mỗi danh mục 2 câu truy vấn, có cache thì chỉ tốn đúng một
            // lần cho mỗi chu kỳ hết hạn chứ không phải mỗi lượt truy cập.
            string keyStoreManager = TConstValue.NewsRespository_CategoryPreview;
            string fieldKey = GenerateUniqueCacheKey(keyStoreManager, $"({_take})");
            string rsCached = await GetFieldOfHashCacheAsync(keyStoreManager, fieldKey);

            if (rsCached is not null)
            {
                apiResponse.DataList = TCommonUtils.ParseJsonStringify<List<NewsCategoryPreviewDto>>(rsCached);
                return apiResponse;
            }

            List<NewsCategoryModel> categories = await _dbContext.NewsCategory.AsNoTracking()
                                                        .Where(c => c.FlagActive)
                                                        .ToListAsync();

            // Danh mục gốc = không có cha, hoặc trỏ tới một cha đã bị vô hiệu/xoá. Vế sau
            // quan trọng: thiếu nó thì nhánh mồ côi biến mất khỏi trang chủ hoàn toàn.
            HashSet<string> activeIds = categories.Select(c => c.NewsCategoryId).ToHashSet();
            List<NewsCategoryModel> roots = categories
                    .Where(c => TCommonUtils.IsNullOrEmpty(c.NewsCategoryParentId)
                                || !activeIds.Contains(c.NewsCategoryParentId))
                    .OrderBy(c => c.NewsCategoryIndex)
                    .ToList();

            List<NewsCategoryPreviewDto> dataResponse = new List<NewsCategoryPreviewDto>();

            foreach (NewsCategoryModel root in roots)
            {
                // Bài nằm ở danh mục con vẫn phải được tính cho danh mục cha, nếu không
                // cha sẽ hiện "0 bài" dù bên dưới đầy bài.
                List<string> branchIds = CollectBranchIds(root.NewsCategoryId, categories);

                IQueryable<NewsModel> query = _dbContext.News.AsNoTracking()
                                                    .Where(n => n.FlagActive && branchIds.Contains(n.CategoryNewsId));

                int totalCount = await query.CountAsync();

                // Danh mục chưa có bài thì bỏ hẳn khỏi kết quả: đưa ra trang chủ chỉ tạo
                // thêm một ô trống dẫn tới trang danh sách rỗng.
                if (totalCount == 0)
                {
                    continue;
                }

                List<NewsCategoryPreviewItemDto> posts = await query
                        .OrderByDescending(n => n.ViewCount)
                        .ThenByDescending(n => n.CreatedDTime)
                        .Take(_take)
                        .Select(n => new NewsCategoryPreviewItemDto
                        {
                            NewsId = n.NewsId,
                            CategoryNewsId = n.CategoryNewsId,
                            Slug = n.Slug,
                            Thumbnail = n.Thumbnail,
                            ShortTitle = n.ShortTitle,
                            CreatedDTime = n.CreatedDTime
                        })
                        .ToListAsync();

                dataResponse.Add(new NewsCategoryPreviewDto
                {
                    NewsCategoryId = root.NewsCategoryId,
                    NewsCategoryName = root.NewsCategoryName,
                    NewsCategoryIndex = root.NewsCategoryIndex,
                    TotalCount = totalCount,
                    Children = categories
                            .Where(c => c.NewsCategoryParentId == root.NewsCategoryId)
                            .OrderBy(c => c.NewsCategoryIndex)
                            .Select(c => new NewsCategoryDto
                            {
                                NewsCategoryId = c.NewsCategoryId,
                                NewsCategoryParentId = c.NewsCategoryParentId,
                                NewsCategoryName = c.NewsCategoryName,
                                NewsCategoryIndex = c.NewsCategoryIndex
                            })
                            .ToList(),
                    Posts = posts
                });
            }

            await HashCacheAsync(keyStoreManager, fieldKey, TCommonUtils.ConvertToJsonStringify(dataResponse));

            apiResponse.DataList = dataResponse;

            return apiResponse;
        }

        /// <summary>
        /// Id của danh mục cùng toàn bộ danh mục con cháu bên dưới nó. Đi theo chiều rộng
        /// và có HashSet chặn: dữ liệu danh mục do người dùng nhập tay ở trang admin, chỉ
        /// cần trỏ cha vòng vào nhau là vòng lặp chạy mãi không dừng.
        /// </summary>
        private static List<string> CollectBranchIds(string rootId, List<NewsCategoryModel> categories)
        {
            HashSet<string> visited = new HashSet<string> { rootId };
            Queue<string> pending = new Queue<string>();
            pending.Enqueue(rootId);

            while (pending.Count > 0)
            {
                string current = pending.Dequeue();

                foreach (NewsCategoryModel child in categories.Where(c => c.NewsCategoryParentId == current))
                {
                    if (visited.Add(child.NewsCategoryId))
                    {
                        pending.Enqueue(child.NewsCategoryId);
                    }
                }
            }

            return visited.ToList();
        }

        public async Task<ApiResponse<RPNewsDto>> Detail(string newsId)
        {
            ApiResponse<RPNewsDto> apiResponse = new ApiResponse<RPNewsDto>();
            List<RequestClient> requestClient = new List<RequestClient>();

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            //bool isAuthorized = GuardAuth.IsAuthorized(token);
            //if (!isAuthorized)
            //{
            //    apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
            //    return apiResponse;
            //}

            // Validate input
            if (TCommonUtils.IsNullOrEmpty(newsId))
            {
                apiResponse.CatchException(false, "News_Detail.NewsIdIsNotValid", requestClient);
                return apiResponse;
            }

            NewsModel objNews = new NewsModel();
            bool isExistRecordNews = CheckNewsExist(newsId, ref objNews);

            if (!isExistRecordNews)
            {
                apiResponse.CatchException(false, "News_Detail.NewsIsNotExist", requestClient);
                return apiResponse;
            }

            // Chặn bài chưa xuất bản. Phải nằm TRƯỚC phần tăng ViewCount và phần đọc cache:
            // cache key chỉ gồm newsId (không có user), nên nếu kiểm tra sau cache thì bản
            // admin đã cache sẽ bị trả cho khách vãng lai. objNews đọc tươi từ DB nên tin được.
            if (!objNews.FlagActive && !CanViewUnpublished(objNews.UserId))
            {
                // Trả cùng thông báo với bài không tồn tại, tránh lộ việc bài đó có thật
                apiResponse.CatchException(false, "News_Detail.NewsIsNotExist", requestClient);
                return apiResponse;
            }

            //
            // Increase ViewCount of News
            int viewCount = ++objNews.ViewCount;
            await _dbContext.News.Where(i => i.NewsId == newsId)
                .ExecuteUpdateAsync(setter =>
                    setter.SetProperty(p => p.ViewCount, viewCount)
                );
            await _dbContext.SaveChangesAsync();

            // Get detail News  
            RPNewsDto rsNews = new RPNewsDto();
            List<string> excludeFields = new List<string>() { };
            // Starting cache data in RedisCloud 
            //string keyCached = TCommonUtils.GenerateUniqueCacheKey(userId, TConstValue.CACHEKEY_NEWS_DETAIL, newsId);
            string cacheId = $"({newsId})";
            string keyCached = GenerateUniqueCacheKey(TConstValue.NewsRespository_Detail, cacheId);
            RPNewsDto rsNewsCached = await GetCacheAsync<RPNewsDto>(keyCached);

            if (rsNewsCached is null)
            {
                rsNews = await FactoryNewsRecord(objNews, excludeFields);
                await SetCacheAsync(keyCached, rsNews);
            }
            else
            {
                rsNews = rsNewsCached;
            }

            apiResponse.Data = rsNews;

            return apiResponse;
        }

        public async Task<ApiResponse<NewsModel>> Create(ClaimsPrincipal User, NewsDto data)
        {
            #region // Preparing 
            ApiResponse<NewsModel> apiResponse = new ApiResponse<NewsModel>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(data, ref requestClient);

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
            DateTime CreatedDTime = TCommonUtils.DTimeNow();
            DateTime UpdatedDTime = TCommonUtils.DTimeNow();
            bool FlagActive = data.FlagActive;
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

            List<HashTagNewsDto> lstHashTagNews = data.LstHashTagNews.GroupBy(i => i.HashTagNewsName).Select(g => g.First()).ToList();
            var x = data.LstHashTagNews.GroupBy(i => i.HashTagNewsName);

            List<HashTagNewsModel> saveDtHashTagNews = new List<HashTagNewsModel>();
            List<string> saveUpdateDtHashTagNews = new List<string>();

            for (int i = 0; i < lstHashTagNews.Count; i++)
            {
                string HashTagNewId = TCommonUtils.PureString(lstHashTagNews[i].HashTagNewsName);
                HashTagNewsModel record = _dbContext.HashTagNews.AsNoTracking()
                                            .FirstOrDefault(i => i.HashTagNewsId == HashTagNewId && i.NewsId == NewsId);

                //if (!(record is null))
                //{ 

                //    lstHashTagNews.Remove(new HashTagNewsDto
                //    {
                //        HashTagNewsName = HashTagNewId
                //    });
                //    saveUpdateDtHashTagNews.Add(HashTagNewId);
                //}
                //else
                //{
                HashTagNewsModel hashTagNews = new HashTagNewsModel()
                {
                    HashTagNewsId = HashTagNewId,
                    HashTagNewsName = HashTagNewId,
                    NewsId = NewsId,
                    FlagActive = true,
                    CreatedDTime = TCommonUtils.DTimeNow(),
                    UpdatedDTime = TCommonUtils.DTimeNow(),
                };

                saveDtHashTagNews.Add(hashTagNews);
                //}
            }
            #endregion

            #region // Save temp RefFileNews
            List<RefFileNewsDto> lstRefFileNews = data.LstRefFileNews;
            List<RefFileNewsModel> saveDtRefFileNews = new List<RefFileNewsModel>();
            for (int i = 0; i < lstRefFileNews.Count; i++)
            {
                string RefFileNewsId = TCommonUtils.GenUniqueId();
                string FileUrl = lstRefFileNews[i].FileUrl;
                RefFileNewsModel record = _dbContext.RefFileNews.AsNoTracking().FirstOrDefault(n => n.RefFileNewsId == RefFileNewsId);

                RefFileNewsModel refFileNews = new RefFileNewsModel()
                {
                    RefFileNewsId = RefFileNewsId,
                    NewsId = NewsId,
                    FileUrl = FileUrl,
                    FlagActive = true,
                    CreatedDTime = TCommonUtils.DTimeNow(),
                    UpdatedDTime = TCommonUtils.DTimeNow(),

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

            if (saveUpdateDtHashTagNews.Count > 0)
            {
                foreach (var item in saveUpdateDtHashTagNews)
                {

                    await _dbContext.HashTagNews.Where(i => i.HashTagNewsId == item)
                        .ExecuteUpdateAsync(setter =>
                             setter.SetProperty(i => i.Count, i => i.Count + 1)
                        );
                }
            }

            if (saveDtRefFileNews.Count > 0)
            {
                await _dbContext.RefFileNews.AddRangeAsync(saveDtRefFileNews);
            }

            await _dbContext.SaveChangesAsync();

            // when create new post => delete cached search api
            string keyStoreManager = TConstValue.NewsRespository_Search;
            await DeleteCachedAsync(keyStoreManager);
            #endregion 
            return apiResponse;
        }

        public async Task<ApiResponse<NewsModel>> Like(ClaimsPrincipal User, string newsId)
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
            #endregion

            #region // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            //bool isAuthorized = GuardAuth.IsAuthorized(token);
            //if (!isAuthorized)
            //{
            //    apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
            //    return apiResponse;
            //}
            #endregion

            #region // Validate input 
            NewsModel objNews = new NewsModel();
            bool isExistRecordNews = CheckNewsExist(newsId, ref objNews);

            if (!isExistRecordNews)
            {
                apiResponse.CatchException(false, "LikeNews.NewsIsNotExist", requestClient);
                return apiResponse;
            }
            #endregion

            #region // Save into Database
            LikeNewsModel objLikeNews = new LikeNewsModel();
            bool isExistRecordLikeNews = CheckLikeNewsExist(newsId, currentUserId, ref objLikeNews);

            if (!isExistRecordLikeNews)
            {
                await _dbContext.LikeNews.AddAsync(new LikeNewsModel
                {
                    NewsId = objNews.NewsId,
                    UserId = currentUserId,
                    CreatedDTime = TCommonUtils.DTimeNow(),
                    UpdatedDTime = TCommonUtils.DTimeNow()
                });
                await _dbContext.SaveChangesAsync();
            }
            else
            {
                await _dbContext.LikeNews.Where(i => i.LikeNewsId == objLikeNews.LikeNewsId).ExecuteDeleteAsync();
                await _dbContext.SaveChangesAsync();

                // delete cached search api
                string keyStoreManager = TConstValue.NewsRespository_Search;
                await DeleteCachedAsync(keyStoreManager);
            }
            #endregion

            return apiResponse;
        }

        public async Task<ApiResponse<NewsModel>> Point(ClaimsPrincipal User, string newsId, double point)
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
            #endregion

            #region // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            //bool isAuthorized = GuardAuth.IsAuthorized(token);
            //if (!isAuthorized)
            //{
            //    apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
            //    return apiResponse;
            //}
            #endregion

            #region // Validate input 
            double pointVal;

            if (!TCommonUtils.IsDoubleType(point))
            {
                apiResponse.CatchException(false, "PointNews.PointValueIsNotValid", requestClient);
                return apiResponse;
            }
            else
            {
                double _point = TCommonUtils.ConvertToDouble(point);
                if (_point > TConstValue.MAX_POINT_NEWS)
                {
                    pointVal = TConstValue.MAX_POINT_NEWS;
                }
                else if (_point <= TConstValue.MIN_POINT_NEWS)
                {
                    pointVal = TConstValue.MIN_POINT_NEWS;
                }
                else
                {
                    pointVal = _point;
                }
            }

            NewsModel objNews = new NewsModel();
            bool isExistRecordNews = CheckNewsExist(newsId, ref objNews);

            if (!isExistRecordNews)
            {
                apiResponse.CatchException(false, "PointNews.NewsIsNotExist", requestClient);
                return apiResponse;
            }
            #endregion

            #region // Save into Database
            PointNewsModel objPointNews = new PointNewsModel();
            bool isExistRecordPointNews = CheckPointNewsExist(newsId, currentUserId, ref objPointNews);

            if (!isExistRecordPointNews)
            {
                // Cách 1
                //FormattableString sql = $"insert into PointNews(NewsId, UserId, Point, FlagActive, CreatedDTime, UpdatedDTime) values ({objNews.NewsId}, {currentUserId}, {pointVal}, {true}, {TCommonUtils.DTimeNow()}, {TCommonUtils.DTimeNow()})";
                //_dbContext.Database.ExecuteSql(sql);

                // Cách 2
                //await _dbContext.PointNews.AddAsync(new PointNewsModel
                //{
                //    NewsId = objNews.NewsId,
                //    UserId = currentUserId,
                //    Point = pointVal,
                //    FlagActive = true,
                //    CreatedDTime = TCommonUtils.DTimeNow(),
                //    UpdatedDTime = TCommonUtils.DTimeNow()
                //});
                //await _dbContext.SaveChangesAsync();

                // Cách 3: Using Dapper
                //using (var connection = new SqliteConnection(_connectionString))
                //{
                //    string sql = @"INSERT INTO PointNews (NewsId, UserId, Point, FlagActive, CreatedDTime, UpdatedDTime) 
                //   VALUES (@NewsId, @UserId, @Point, @FlagActive, @CreatedDTime, @UpdatedDTime)";

                //    await connection.ExecuteAsync(sql, new
                //    {
                //        NewsId = objNews.NewsId,
                //        UserId = currentUserId,
                //        Point = pointVal,
                //        FlagActive = true,
                //        CreatedDTime = TCommonUtils.DTimeNow(),
                //        UpdatedDTime = TCommonUtils.DTimeNow()
                //    });
                //}

                // delete cached search api
                string keyStoreManager = TConstValue.NewsRespository_Search;
                await DeleteCachedAsync(keyStoreManager);

            }
            #endregion

            return apiResponse;
        }

        public async Task<ApiResponse<NewsModel>> Update(ClaimsPrincipal User, UpdateNewsDto data)
        {
            #region // Preparing 
            ApiResponse<NewsModel> apiResponse = new ApiResponse<NewsModel>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(data, ref requestClient);

            // Get current user
            string currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (TCommonUtils.IsNullOrEmpty(currentUserId))
            {
                apiResponse.CatchException(false, "News_Update.UserNotFound", requestClient);
                return apiResponse;
            }

            // Parse input data
            string newsId = TCommonUtils.PureString(data.NewsId);
            string CategoryNewsId = TCommonUtils.PureString(data.CategoryNewsId);
            string Slug = TCommonUtils.GenerateSlug(data.ShortTitle);
            string Thumbnail = TCommonUtils.PureString(data.Thumbnail);
            string ShortTitle = TCommonUtils.PureString(data.ShortTitle);
            string ShortDescription = TCommonUtils.PureString(data.ShortDescription);
            string ContentBody = data.ContentBody;
            DateTime UpdatedDTime = TCommonUtils.DTimeNow();
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
            if (TCommonUtils.IsNullOrEmpty(newsId))
            {
                apiResponse.CatchException(false, "News_Update.NewsIdIsRequired", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(ShortTitle))
            {
                apiResponse.CatchException(false, "News_Update.ShortTitleIsNotValid", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(ShortDescription))
            {
                apiResponse.CatchException(false, "News_Update.ShortDescriptionIsNotValid", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(ContentBody))
            {
                apiResponse.CatchException(false, "News_Update.ContentBodyIsNotValid", requestClient);
                return apiResponse;
            }

            // Check if category exists
            NewsCategoryModel objNewsCategory = new NewsCategoryModel();
            bool isExistRecordNewsCategory = CheckNewsCategoryExist(CategoryNewsId, ref objNewsCategory);
            if (!isExistRecordNewsCategory)
            {
                apiResponse.CatchException(false, "News_Update.NewsCategoryIsNotExist", requestClient);
                return apiResponse;
            }

            // ✅ Check if news exists and get existing record
            NewsModel existingNews = await _dbContext.News.FirstOrDefaultAsync(n => n.NewsId == newsId);

            if (existingNews == null)
            {
                apiResponse.CatchException(false, "News_Update.NewsWasNotExisted", requestClient);
                return apiResponse;
            }

            // ✅ Check if user owns this news (optional security check)
            if (existingNews.UserId != currentUserId)
            {
                apiResponse.CatchException(false, "News_Update.UnauthorizedToEditThisNews", requestClient);
                return apiResponse;
            }
            #endregion

            #region // Update News Record
            existingNews.CategoryNewsId = CategoryNewsId;
            existingNews.Slug = Slug;
            existingNews.Thumbnail = Thumbnail;
            existingNews.ShortTitle = ShortTitle;
            existingNews.ShortDescription = ShortDescription;
            existingNews.ContentBody = ContentBody;
            existingNews.UpdatedDTime = UpdatedDTime;
            existingNews.FlagActive = data.FlagActive;

            _dbContext.News.Update(existingNews);
            #endregion

            #region // Update HashTagNews

            // ✅ Remove old hashtags
            var oldHashTags = await _dbContext.HashTagNews
                .Where(h => h.NewsId == newsId)
                .ToListAsync();

            if (oldHashTags.Any())
            {
                _dbContext.HashTagNews.RemoveRange(oldHashTags);
            }

            // ✅ Add new hashtags (remove duplicates)
            List<HashTagNewsDto> lstHashTagNews = data.LstHashTagNews
                .GroupBy(i => i.HashTagNewsName)
                .Select(g => g.First())
                .ToList();

            List<HashTagNewsModel> newHashTags = new List<HashTagNewsModel>();

            foreach (var hashTag in lstHashTagNews)
            {
                string hashTagId = TCommonUtils.PureString(hashTag.HashTagNewsName);

                if (!string.IsNullOrEmpty(hashTagId))
                {
                    HashTagNewsModel newHashTag = new HashTagNewsModel()
                    {
                        HashTagNewsId = hashTagId,
                        HashTagNewsName = hashTagId,
                        NewsId = newsId,
                        FlagActive = true,
                        CreatedDTime = TCommonUtils.DTimeNow(),
                        UpdatedDTime = TCommonUtils.DTimeNow(),
                        Count = 1 // or increment if exists globally
                    };

                    newHashTags.Add(newHashTag);
                }
            }

            if (newHashTags.Any())
            {
                await _dbContext.HashTagNews.AddRangeAsync(newHashTags);
            }
            #endregion

            #region // Update RefFileNews

            // ✅ Remove old files
            var oldRefFiles = await _dbContext.RefFileNews
                .Where(r => r.NewsId == newsId)
                .ToListAsync();

            if (oldRefFiles.Any())
            {
                _dbContext.RefFileNews.RemoveRange(oldRefFiles);
            }

            // ✅ Add new files
            List<RefFileNewsDto> lstRefFileNews = data.LstRefFileNews ?? new List<RefFileNewsDto>();
            List<RefFileNewsModel> newRefFiles = new List<RefFileNewsModel>();

            foreach (var refFile in lstRefFileNews)
            {
                if (!string.IsNullOrEmpty(refFile.FileUrl))
                {
                    string refFileNewsId = TCommonUtils.GenUniqueId();

                    RefFileNewsModel newRefFile = new RefFileNewsModel()
                    {
                        RefFileNewsId = refFileNewsId,
                        NewsId = newsId,
                        FileUrl = refFile.FileUrl,
                        FlagActive = true,
                        CreatedDTime = TCommonUtils.DTimeNow(),
                        UpdatedDTime = TCommonUtils.DTimeNow(),
                    };

                    newRefFiles.Add(newRefFile);
                }
            }

            if (newRefFiles.Any())
            {
                await _dbContext.RefFileNews.AddRangeAsync(newRefFiles);
            }
            #endregion

            #region // Save changes and clear cache
            try
            {
                await _dbContext.SaveChangesAsync();

                // Clear cached search results
                string keyStoreManager = TConstValue.NewsRespository_Search;
                await DeleteCachedAsync(keyStoreManager);

                // ✅ Return updated news
                apiResponse.Success = true;
                apiResponse.Data = existingNews;
            }
            catch (Exception ex)
            {
                apiResponse.CatchException(false, $"News_Update.Error: {ex.Message}", requestClient);
            }
            #endregion

            return apiResponse;
        }
    }
}
