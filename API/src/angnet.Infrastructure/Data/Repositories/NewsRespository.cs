using angnet.Application.Interfaces.Repositories;
using angnet.Domain.Dtos;
using angnet.Domain.Enums;
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

        /// <summary>
        /// Kiểm tra phạm vi xem của một bài. Private đúng nghĩa "chỉ mình tôi":
        /// Admin không được bỏ qua. Tenant chỉ cho người cùng tenant với tác giả.
        /// </summary>
        private bool CanViewByVisibility(NewsModel news)
        {
            if (news.WhoCanSee == EWhoCanSee.Public)
            {
                return true;
            }

            ClaimsPrincipal user = _httpContextAccessor.HttpContext?.User;
            if (user?.Identity?.IsAuthenticated != true)
            {
                return false;
            }

            string viewerUserId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (TCommonUtils.IsNullOrEmpty(viewerUserId))
            {
                return false;
            }

            if (viewerUserId == news.UserId)
            {
                return true;
            }

            if (news.WhoCanSee != EWhoCanSee.Tenant)
            {
                return false;
            }

            int? viewerTenantId = _dbContext.Users.AsNoTracking()
                    .Where(u => u.Id == viewerUserId)
                    .Select(u => (int?)u.TenantId)
                    .FirstOrDefault();
            int? authorTenantId = _dbContext.Users.AsNoTracking()
                    .Where(u => u.Id == news.UserId)
                    .Select(u => (int?)u.TenantId)
                    .FirstOrDefault();

            return viewerTenantId.HasValue
                   && viewerTenantId.Value > 0
                   && viewerTenantId == authorTenantId;
        }

        private bool CanViewNews(NewsModel news)
        {
            return news.FlagActive
                ? CanViewByVisibility(news)
                : CanViewUnpublished(news.UserId);
        }

        /// <summary>
        /// Gán những thứ riêng của người đang đăng nhập: điểm họ đã chấm (0 = chưa
        /// chấm) và đã thả tim hay chưa.
        /// Phải gọi SAU khi lấy dữ liệu, kể cả khi dữ liệu đến từ cache: cache
        /// đánh theo newsId / tham số tìm kiếm chứ không theo user, nên phần riêng
        /// của từng người không được phép nằm trong dữ liệu đem đi cache.
        /// </summary>
        private void FillMyInteractions(List<RPNewsDto> lstNews)
        {
            ClaimsPrincipal user = _httpContextAccessor.HttpContext?.User;
            if (user?.Identity?.IsAuthenticated != true || lstNews.Count == 0)
            {
                return;
            }

            string userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (TCommonUtils.IsNullOrEmpty(userId))
            {
                return;
            }

            List<string> lstNewsId = lstNews.Select(i => i.NewsId).ToList();
            Dictionary<string, double> myPoints = _dbContext.PointNews.AsNoTracking()
                .Where(i => i.UserId == userId && lstNewsId.Contains(i.NewsId))
                .ToDictionary(i => i.NewsId, i => i.Point);

            HashSet<string> myLikes = _dbContext.LikeNews.AsNoTracking()
                .Where(i => i.UserId == userId && lstNewsId.Contains(i.NewsId))
                .Select(i => i.NewsId)
                .ToHashSet();

            foreach (RPNewsDto item in lstNews)
            {
                item.MyPoint = myPoints.TryGetValue(item.NewsId, out double point) ? point : 0;
                item.IsLikedByMe = myLikes.Contains(item.NewsId);
            }
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

        private static List<HashTagNewsModel> BuildHashTagModels(
            string newsId,
            IEnumerable<HashTagNewsDto>? hashtags,
            string languageCode)
        {
            return (hashtags ?? Enumerable.Empty<HashTagNewsDto>())
                .Select(i => TCommonUtils.PureString(i.HashTagNewsName))
                .Where(i => !TCommonUtils.IsNullOrEmpty(i))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Select(name => new HashTagNewsModel
                {
                    HashTagNewsId = name,
                    HashTagNewsName = name,
                    NewsId = newsId,
                    LanguageCode = languageCode,
                    FlagActive = true,
                    CreatedDTime = TCommonUtils.DTimeNow(),
                    UpdatedDTime = TCommonUtils.DTimeNow(),
                    Count = 1
                })
                .ToList();
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

            List<HashTagNewsDto> lstHashTagNews = dtHashTagNews
                .Where(i => i.LanguageCode == "vi")
                .Select(i => new HashTagNewsDto
            {
                HashTagNewsName = i.HashTagNewsName
            }).ToList();

            List<HashTagNewsDto> lstHashTagNewsEn = dtHashTagNews
                .Where(i => i.LanguageCode == "en")
                .Select(i => new HashTagNewsDto
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

            // MyPoint KHÔNG tính ở đây: kết quả của factory bị cache theo newsId /
            // tham số tìm kiếm chứ không theo user, gán điểm riêng của người này vào
            // đây là lần sau người khác đọc cache sẽ nhận đúng điểm đó. Gọi
            // FillMyInteractions() sau khi đã lấy dữ liệu (kể cả từ cache) thay cho việc này.

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
            (int estimatedReadingTimeEn, int wordCountContentEn) = TCommonUtils.CalculateReadingTime(objNews.ContentBodyEn);
            //
            rsNews.NewsId = objNews.NewsId;
            rsNews.UserId = objNews.UserId;
            rsNews.UserName = userDetail.UserName;
            rsNews.FullName = userDetail.FullName;
            rsNews.Avatar = userDetail.Avatar;
            rsNews.CategoryNewsId = objNews.CategoryNewsId;
            rsNews.CategoryNewsName = categoryDetail.NewsCategoryName;
            rsNews.CategoryNewsNameEn = categoryDetail.NewsCategoryNameEn;
            rsNews.Slug = objNews.Slug;
            rsNews.SlugEn = objNews.SlugEn;
            rsNews.Thumbnail = objNews.Thumbnail;
            rsNews.ShortTitle = objNews.ShortTitle;
            rsNews.ShortTitleEn = objNews.ShortTitleEn;
            rsNews.ShortDescription = objNews.ShortDescription;
            rsNews.ShortDescriptionEn = objNews.ShortDescriptionEn;
            rsNews.ContentBody = excludeFields.Contains("ContentBody") ? null : objNews.ContentBody;
            rsNews.ContentBodyEn = excludeFields.Contains("ContentBody") ? null : objNews.ContentBodyEn;
            rsNews.HasEnglishTranslation = !TCommonUtils.IsNullOrEmpty(objNews.ShortTitleEn)
                                           && !TCommonUtils.IsNullOrEmpty(objNews.ShortDescriptionEn)
                                           && !TCommonUtils.IsNullOrEmpty(objNews.ContentBodyEn);
            rsNews.CreatedDTime = objNews.CreatedDTime;
            rsNews.UpdatedDTime = objNews.UpdatedDTime;
            rsNews.FlagActive = objNews.FlagActive;
            rsNews.WhoCanSee = objNews.WhoCanSee;
            rsNews.ViewCount = objNews.ViewCount; // Luôn luôn trễ hơn 1 lượt xem
            rsNews.ShareCount = 0;
            rsNews.LikeCount = countLike;
            rsNews.AvgPoint = avgPoint;
            rsNews.IsPinned = objNews.IsPinned;
            rsNews.NotifiedAt = objNews.NotifiedAt;
            rsNews.PinOrder = objNews.PinOrder;
            rsNews.TotalPoint = dtPointNews.Count;
            rsNews.LstHashTagNews = lstHashTagNews;
            rsNews.LstHashTagNewsEn = lstHashTagNewsEn;
            rsNews.LstRefFileNews = excludeFields.Contains("LstRefFileNews") ? null : lstRefFileNews;
            rsNews.EstimatedReadingTime = estimatedReadingTime;
            rsNews.EstimatedReadingTimeEn = estimatedReadingTimeEn;

            // 
            return rsNews;

        }

        /// <summary>
        /// Thứ tự trả về của Search. Mặc định (chuỗi rỗng hoặc giá trị lạ) là bài mới nhất
        /// trước, giữ nguyên hành vi cũ.
        ///
        /// pinnedFirst chỉ bật cho khối "Bài viết nổi bật" ngoài trang chủ. Trước đây
        /// ghim áp cho MỌI lời gọi Search, mà cả khối nổi bật lẫn danh sách "Tất cả
        /// bài viết" đều dùng chung endpoint này - nên bài ghim đứng đầu cả hai khối
        /// nằm sát nhau, nhìn thành lặp nội dung. Danh sách chính, sidebar và bảng
        /// quản trị giữ nguyên thứ tự theo ngày đăng / lượt đọc.
        /// </summary>
        private IOrderedQueryable<NewsModel> ApplySort(IQueryable<NewsModel> query, string sort, bool pinnedFirst)
        {
            // Bài ghim đứng trên trong phạm vi đã bật cờ, bất kể đang sắp theo kiểu
            // nào. Chỉ sắp theo PinOrder giữa các bài cùng ghim; phần còn lại do từng
            // nhánh bên dưới quyết định.
            //
            // Khi tắt cờ vẫn phải trả về IOrderedQueryable để các ThenBy bên dưới dùng
            // được, nên sắp theo một hằng số - không đổi thứ tự gì cả.
            IOrderedQueryable<NewsModel> pinned = pinnedFirst
                ? query.OrderByDescending(i => i.IsPinned)
                       .ThenBy(i => i.IsPinned ? i.PinOrder : 0)
                : query.OrderBy(i => 0);

            switch (sort)
            {
                // Cột News.ViewCount được tăng mỗi lần gọi Detail nên đọc thẳng được.
                case "views":
                    return pinned.ThenByDescending(i => i.ViewCount)
                                 .ThenByDescending(i => i.CreatedDTime);

                // Không dùng cột News.LikeCount: cột đó không có chỗ nào ghi vào (chỉ Reel
                // mới duy trì cột tương tự), like của bài viết nằm ở bảng LikeNews -
                // FactoryNewsRecord cũng đang đếm theo bảng đó nên sắp xếp phải khớp.
                case "likes":
                    return pinned.ThenByDescending(i => _dbContext.LikeNews.Count(l => l.NewsId == i.NewsId))
                                 .ThenByDescending(i => i.CreatedDTime);

                default:
                    return pinned.ThenByDescending(i => i.CreatedDTime);
            }
        }

        public async Task<ApiResponse<RPNewsDto>> Search(int pageIndex, int pageSize, string keyword, string userId, string categoryId, bool onlyPublished = true, string hashTag = "", string sort = "", bool pinnedFirst = false, string whoCanSee = "")
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
            EWhoCanSee? visibilityFilter = Enum.TryParse(whoCanSee, true, out EWhoCanSee parsedVisibility)
                    && Enum.IsDefined(parsedVisibility)
                ? parsedVisibility
                : null;
            ClaimsPrincipal viewer = _httpContextAccessor.HttpContext?.User;
            string viewerUserId = viewer?.Identity?.IsAuthenticated == true
                    ? viewer.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty
                    : string.Empty;
            int? viewerTenantId = TCommonUtils.IsNullOrEmpty(viewerUserId)
                    ? null
                    : await _dbContext.Users.AsNoTracking()
                            .Where(u => u.Id == viewerUserId)
                            .Select(u => (int?)u.TenantId)
                            .FirstOrDefaultAsync();

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
                                             || i.ShortTitleEn.Trim().ToLower().Contains(_keyword)
                                             || i.ShortDescriptionEn.Trim().ToLower().Contains(_keyword)
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
                // Khi chọn một danh mục cha, danh sách phải gồm cả bài nằm trong mọi
                // nhánh con. Trước đây chỉ so sánh đúng CategoryNewsId nên bấm cha có
                // thể ra danh sách rỗng dù số đếm của cha vẫn bao gồm bài của con.
                List<NewsCategoryModel> activeCategories = await _dbContext.NewsCategory
                        .AsNoTracking()
                        .Where(c => c.FlagActive)
                        .ToListAsync();

                NewsCategoryModel? selectedCategory = activeCategories.FirstOrDefault(c =>
                        c.NewsCategoryId.Trim().ToLower() == _categoryId);

                if (selectedCategory is null)
                {
                    query = _dbContext.News.AsNoTracking()
                                         .Where(i => i.CategoryNewsId.Trim().ToLower() == _categoryId);
                }
                else
                {
                    List<string> branchIds = CollectBranchIds(
                            selectedCategory.NewsCategoryId,
                            activeCategories);

                    query = _dbContext.News.AsNoTracking()
                                         .Where(i => branchIds.Contains(i.CategoryNewsId));
                }
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

            if (visibilityFilter.HasValue)
            {
                query = query.Where(i => i.WhoCanSee == visibilityFilter.Value);
            }

            // Search public không bao giờ trả bài Private. Khi dashboard yêu cầu cả
            // bài nháp, tác giả vẫn xem được bài Private của chính mình. Tenant được
            // nhìn thấy bởi người đăng nhập cùng tenant với tác giả.
            if (onlyPublished)
            {
                // Bài Private chỉ được đưa vào kết quả khi caller chủ động mở đúng
                // danh sách "Riêng tư". Các danh sách công khai như trang chủ không
                // được trộn bài riêng vào, kể cả người đang xem chính là tác giả.
                bool includeOwnPrivate = visibilityFilter == EWhoCanSee.Private;
                query = query.Where(i =>
                    i.WhoCanSee == EWhoCanSee.Public
                    || (includeOwnPrivate
                        && i.WhoCanSee == EWhoCanSee.Private
                        && i.UserId == viewerUserId)
                    || (i.WhoCanSee == EWhoCanSee.Tenant
                        && viewerTenantId.HasValue
                        && viewerTenantId.Value > 0
                        && _dbContext.Users.Any(u =>
                            u.Id == i.UserId && u.TenantId == viewerTenantId.Value)));
            }
            else
            {
                query = query.Where(i =>
                    i.WhoCanSee == EWhoCanSee.Public
                    || i.UserId == viewerUserId
                    || (i.WhoCanSee == EWhoCanSee.Tenant
                        && viewerTenantId.HasValue
                        && viewerTenantId.Value > 0
                        && _dbContext.Users.Any(u =>
                            u.Id == i.UserId && u.TenantId == viewerTenantId.Value)));
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
            // pinnedFirst nằm trong khoá cache vì nó đổi thứ tự kết quả: thiếu nó thì
            // khối "Bài viết nổi bật" và danh sách thường (cùng sort=views) dùng
            // chung một ô nhớ, ai gọi trước ghi gì thì người sau nhận đúng cái đó.
            // v2 tách khỏi kết quả cũ vốn chỉ lọc đúng một CategoryNewsId. Nếu không
            // đổi field cache, sau khi deploy danh mục cha vẫn có thể trả dữ liệu cũ
            // trong tối đa 30 phút.
            string visibilityScope = onlyPublished
                    ? $"tenant:{viewerTenantId?.ToString() ?? "anonymous"}"
                    : $"viewer:{viewerUserId}|tenant:{viewerTenantId?.ToString() ?? "none"}";
            string primaryKey = $"v6|({pageIndex}, {pageSize}, {keyword}, {userId}, {categoryId}, {onlyPublished}, {hashTag}, {_sort}, {pinnedFirst}, {visibilityFilter?.ToString() ?? "all"}, {visibilityScope})";
            string keyStoreManager = TConstValue.NewsRespository_Search;

            string fieldKey = GenerateUniqueCacheKey(keyStoreManager, primaryKey);
            string rsNewsCached = await GetFieldOfHashCacheAsync(keyStoreManager, fieldKey);

            if (rsNewsCached is null)
            {
                dataResult = ApplySort(query, _sort, pinnedFirst)
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

            // Sau cache: điểm riêng của người đang xem không nằm trong bản cache chung.
            FillMyInteractions(dataResponse);

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
        /// khối khám phá chủ đề ngoài trang chủ. Khi hotOnly = true, danh mục được
        /// lọc và sắp xếp theo SysParameter HOME_HOT_TOPIC_CATEGORY_IDS.
        ///
        /// Gộp tất cả vào một lần gọi thay vì để client bắn mỗi danh mục một request:
        /// blog đang có 9 danh mục, cứ mỗi lần mở trang chủ là 9 round-trip.
        /// </summary>
        public async Task<ApiResponse<NewsCategoryPreviewDto>> CategoryPreview(int take, bool hotOnly = false)
        {
            ApiResponse<NewsCategoryPreviewDto> apiResponse = new ApiResponse<NewsCategoryPreviewDto>();

            // take do client truyền: chặn trên để một request lỡ tay không kéo về cả blog.
            int _take = (take > 0 && take <= 10) ? take : 3;

            // Chỉ khối "Khám phá các chủ đề hot" dùng cấu hình này. Thanh chọn chủ
            // đề và cây danh mục vẫn gọi hotOnly=false để luôn có đủ danh mục.
            (bool hasHotTopicConfig, List<string> hotTopicCategoryIds, string configSignature)
                = hotOnly
                    ? await GetHotTopicCategoryIds()
                    : (false, new List<string>(), "all");

            // Nội dung giống hệt nhau với mọi khách nên cache được nguyên khối. Số bài
            // theo danh mục được gom bằng một query, sau đó mỗi danh mục gốc chỉ cần lấy
            // danh sách bài tiêu biểu của nhánh.
            string keyStoreManager = TConstValue.NewsRespository_CategoryPreview;
            // Chữ ký cấu hình nằm trong cache key: admin đổi danh sách hoặc thứ tự
            // là request kế tiếp dùng payload mới ngay, không nhận bản cache cũ.
            string fieldKey = GenerateUniqueCacheKey(
                keyStoreManager,
                $"v4|({_take})|hotOnly={hotOnly}|config={configSignature}"
            );
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
            List<NewsCategoryModel> roots;

            if (hotOnly && hasHotTopicConfig)
            {
                // Không OrderBy ở đây: thứ tự mảng JSON là thứ tự hiển thị. ID
                // trùng được loại từ lúc parse; ID sai hoặc inactive được bỏ qua.
                Dictionary<string, NewsCategoryModel> categoryById = categories
                        .ToDictionary(c => c.NewsCategoryId, StringComparer.Ordinal);

                roots = hotTopicCategoryIds
                        .Where(categoryById.ContainsKey)
                        .Select(id => categoryById[id])
                        .ToList();
            }
            else
            {
                // Không có cấu hình hợp lệ thì giữ hành vi cũ để deploy không làm
                // biến mất cả khối trước khi migration seed chạy xong.
                roots = categories
                        .Where(c => TCommonUtils.IsNullOrEmpty(c.NewsCategoryParentId)
                                    || !activeIds.Contains(c.NewsCategoryParentId))
                        .OrderBy(c => c.NewsCategoryIndex)
                        .ToList();
            }

            List<NewsCategoryPreviewDto> dataResponse = new List<NewsCategoryPreviewDto>();

            // Đếm một lần theo danh mục rồi cộng theo từng nhánh ở bộ nhớ. Như vậy danh
            // mục con có số lượng chính xác mà không phát sinh thêm một query cho mỗi con.
            Dictionary<string, int> publishedCountByCategory = await _dbContext.News
                    .AsNoTracking()
                    .Where(n => n.FlagActive && n.WhoCanSee == EWhoCanSee.Public)
                    .GroupBy(n => n.CategoryNewsId)
                    .Select(group => new
                    {
                        CategoryId = group.Key,
                        Count = group.Count()
                    })
                    .ToDictionaryAsync(item => item.CategoryId, item => item.Count);

            foreach (NewsCategoryModel root in roots)
            {
                // Bài nằm ở danh mục con vẫn phải được tính cho danh mục cha, nếu không
                // cha sẽ hiện "0 bài" dù bên dưới đầy bài.
                List<string> branchIds = CollectBranchIds(root.NewsCategoryId, categories);

                IQueryable<NewsModel> query = _dbContext.News.AsNoTracking()
                                                    .Where(n => n.FlagActive
                                                                && n.WhoCanSee == EWhoCanSee.Public
                                                                && branchIds.Contains(n.CategoryNewsId));

                int totalCount = branchIds.Sum(id =>
                        publishedCountByCategory.TryGetValue(id, out int count) ? count : 0);

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
                            SlugEn = n.SlugEn,
                            Thumbnail = n.Thumbnail,
                            ShortTitle = n.ShortTitle,
                            ShortTitleEn = n.ShortTitleEn,
                            HasEnglishTranslation = n.ShortTitleEn != ""
                                                    && n.ShortDescriptionEn != ""
                                                    && n.ContentBodyEn != "",
                            CreatedDTime = n.CreatedDTime
                        })
                        .ToListAsync();

                dataResponse.Add(new NewsCategoryPreviewDto
                {
                    NewsCategoryId = root.NewsCategoryId,
                    NewsCategoryName = root.NewsCategoryName,
                    NewsCategoryNameEn = root.NewsCategoryNameEn,
                    NewsCategoryLogo = root.NewsCategoryLogo,
                    NewsCategoryIndex = root.NewsCategoryIndex,
                    TotalCount = totalCount,
                    Children = categories
                            .Where(c => c.NewsCategoryParentId == root.NewsCategoryId)
                            .OrderBy(c => c.NewsCategoryIndex)
                            .Select(c => new NewsCategoryPreviewChildDto
                            {
                                NewsCategoryId = c.NewsCategoryId,
                                NewsCategoryParentId = c.NewsCategoryParentId,
                                NewsCategoryName = c.NewsCategoryName,
                                NewsCategoryNameEn = c.NewsCategoryNameEn,
                                NewsCategoryLogo = c.NewsCategoryLogo,
                                NewsCategoryIndex = c.NewsCategoryIndex,
                                TotalCount = CollectBranchIds(c.NewsCategoryId, categories)
                                        .Sum(id => publishedCountByCategory.TryGetValue(id, out int count)
                                                ? count
                                                : 0)
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
        /// Đọc danh sách danh mục hot có thứ tự. Trả hasConfig=false nếu tham số
        /// chưa tồn tại hoặc JSON lỗi để caller fallback về hành vi cũ; mảng rỗng
        /// hợp lệ vẫn là một cấu hình và có nghĩa là không hiển thị danh mục nào.
        /// </summary>
        private async Task<(bool HasConfig, List<string> CategoryIds, string Signature)> GetHotTopicCategoryIds()
        {
            SysParameterModel? parameter = await _dbContext.SysParameter
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p =>
                        p.ParameterCode == TConstValue.HOME_HOT_TOPIC_CATEGORY_IDS
                        && p.FlagActive);

            if (parameter is null)
            {
                return (false, new List<string>(), "missing");
            }

            // Cấu hình này không phụ thuộc ngôn ngữ. Ưu tiên ValueVi, nhưng vẫn
            // thử ValueEn/default để một ô bị để trống hoặc nhập JSON lỗi không
            // làm mất cấu hình hợp lệ ở ô còn lại.
            string[] candidates = new string[]
            {
                parameter.ParameterValueVi,
                parameter.ParameterValueEn,
                parameter.DefaultValueVi,
                parameter.DefaultValueEn
            };

            foreach (string rawValue in candidates.Where(value => !TCommonUtils.IsNullOrEmpty(value)))
            {
                try
                {
                    List<string> configuredIds = System.Text.Json.JsonSerializer
                            .Deserialize<List<string>>(rawValue) ?? new List<string>();

                    List<string> normalizedIds = configuredIds
                            .Where(id => !TCommonUtils.IsNullOrEmpty(id))
                            .Select(id => id.Trim())
                            .Distinct(StringComparer.Ordinal)
                            .ToList();

                    string signature = normalizedIds.Count == 0
                            ? "empty"
                            : string.Join(",", normalizedIds);

                    return (true, normalizedIds, signature);
                }
                catch (System.Text.Json.JsonException)
                {
                    // Thử cột giá trị/default tiếp theo.
                }
            }

            return (false, new List<string>(), "invalid");
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
            if (!CanViewNews(objNews))
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

            // ViewCount vừa tăng ở trên nhưng bản cache giữ số cũ, mà cache sống tới
            // 30 phút nên để nguyên là số lượt xem đứng im gần nửa tiếng. Gán lại từ
            // biến vừa tính thay vì xoá cache - xoá thì mỗi lượt xem lại kéo theo một
            // vòng nạp lại toàn bộ bài, đúng thứ đang cần tránh.
            rsNews.ViewCount = viewCount;

            // Sau cache: điểm riêng của người đang xem không nằm trong bản cache chung.
            FillMyInteractions(new List<RPNewsDto> { rsNews });

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
            string ShortTitleEn = TCommonUtils.PureString(data.ShortTitleEn);
            string SlugEn = TCommonUtils.IsNullOrEmpty(ShortTitleEn)
                ? string.Empty
                : TCommonUtils.GenerateSlug(ShortTitleEn);
            string Thumbnail = TCommonUtils.PureString(data.Thumbnail);
            string ShortTitle = TCommonUtils.PureString(data.ShortTitle);
            string ShortDescription = TCommonUtils.PureString(data.ShortDescription);
            string ShortDescriptionEn = TCommonUtils.PureString(data.ShortDescriptionEn);
            string ContentBody = data.ContentBody;
            string ContentBodyEn = data.ContentBodyEn ?? string.Empty;
            DateTime CreatedDTime = TCommonUtils.DTimeNow();
            DateTime UpdatedDTime = TCommonUtils.DTimeNow();
            bool FlagActive = data.FlagActive;
            EWhoCanSee WhoCanSee = data.WhoCanSee;
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

            if (!Enum.IsDefined(WhoCanSee))
            {
                apiResponse.CatchException(false, "News_Create.WhoCanSeeIsNotValid", requestClient);
                return apiResponse;
            }

            bool hasEnglishHashtags = data.LstHashTagNewsEn?.Any(i => !TCommonUtils.IsNullOrEmpty(i.HashTagNewsName)) == true;
            bool hasVietnameseHashtags = data.LstHashTagNews?.Any(i => !TCommonUtils.IsNullOrEmpty(i.HashTagNewsName)) == true;
            bool hasAnyEnglishContent = !TCommonUtils.IsNullOrEmpty(ShortTitleEn)
                                        || !TCommonUtils.IsNullOrEmpty(ShortDescriptionEn)
                                        || !TCommonUtils.IsNullOrEmpty(ContentBodyEn)
                                        || hasEnglishHashtags;
            bool hasCompleteEnglishContent = !TCommonUtils.IsNullOrEmpty(ShortTitleEn)
                                             && !TCommonUtils.IsNullOrEmpty(ShortDescriptionEn)
                                             && !TCommonUtils.IsNullOrEmpty(ContentBodyEn);
            if (hasAnyEnglishContent && !hasCompleteEnglishContent)
            {
                apiResponse.CatchException(false, "News_Create.EnglishTranslationIsIncomplete", requestClient);
                return apiResponse;
            }

            if (hasCompleteEnglishContent && hasVietnameseHashtags && !hasEnglishHashtags)
            {
                apiResponse.CatchException(false, "News_Create.EnglishHashtagsAreRequired", requestClient);
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

            List<HashTagNewsModel> saveDtHashTagNews = BuildHashTagModels(NewsId, data.LstHashTagNews, "vi")
                .Concat(BuildHashTagModels(NewsId, data.LstHashTagNewsEn, "en"))
                .ToList();
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
                SlugEn = SlugEn,
                Thumbnail = Thumbnail,
                ShortTitle = ShortTitle,
                ShortTitleEn = ShortTitleEn,
                ShortDescription = ShortDescription,
                ShortDescriptionEn = ShortDescriptionEn,
                ContentBody = ContentBody,
                ContentBodyEn = ContentBodyEn,
                CreatedDTime = CreatedDTime,
                UpdatedDTime = UpdatedDTime,
                FlagActive = FlagActive,
                WhoCanSee = WhoCanSee,
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

            // when create new post => delete cached search api
            string keyStoreManager = TConstValue.NewsRespository_Search;
            await DeleteCachedAsync(keyStoreManager);
            await DeleteCachedAsync(TConstValue.NewsRespository_CategoryPreview);
            #endregion 
            return apiResponse;
        }

        /// <summary>
        /// Bật/tắt ghim một bài viết lên đầu danh sách.
        /// </summary>
        public async Task<ApiResponse<NewsModel>> TogglePin(string newsId, bool isPinned, int pinOrder)
        {
            ApiResponse<NewsModel> apiResponse = new ApiResponse<NewsModel>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(new { newsId, isPinned, pinOrder }, ref requestClient);

            // Phân quyền do controller lo: [Authorize(Policy = "blog.update")].
            // Khác Update bài viết, ghim KHÔNG giới hạn theo tác giả: đây là quyết định
            // biên tập của cả trang chứ không phải sửa nội dung bài của ai.

            if (TCommonUtils.IsNullOrEmpty(newsId))
            {
                apiResponse.CatchException(false, "News_TogglePin.NewsIdIsNotValid", requestClient);
                return apiResponse;
            }

            NewsModel existingNews = await _dbContext.News.FirstOrDefaultAsync(n => n.NewsId == newsId);

            if (existingNews is null)
            {
                apiResponse.CatchException(false, "News_TogglePin.NewsWasNotExisted", requestClient);
                return apiResponse;
            }

            // Chỉ bài đang công khai mới được ghim lên các danh sách công cộng.
            // Vẫn cho phép thao tác bỏ ghim để xử lý dữ liệu cũ nếu có.
            if (isPinned && (!existingNews.FlagActive || existingNews.WhoCanSee != EWhoCanSee.Public))
            {
                apiResponse.CatchException(false, "News_TogglePin.OnlyPublicNewsCanBePinned", requestClient);
                return apiResponse;
            }

            existingNews.IsPinned = isPinned;
            // Bỏ ghim thì đưa thứ tự về 0 luôn, khỏi để lại số cũ gây khó hiểu khi
            // ghim lại lần sau.
            existingNews.PinOrder = isPinned ? pinOrder : 0;
            existingNews.UpdatedDTime = TCommonUtils.DTimeNow();

            _dbContext.News.Update(existingNews);
            await _dbContext.SaveChangesAsync();

            // Xoá cache danh sách: thiếu bước này thì bài vừa ghim vẫn nằm đúng chỗ cũ
            // cho tới khi cache hết hạn.
            await DeleteCachedAsync(TConstValue.NewsRespository_Search);
            await DeleteCachedAsync(GenerateUniqueCacheKey(TConstValue.NewsRespository_Detail, $"({newsId})"));

            apiResponse.Data = existingNews;

            // Không ghi AuditTrail ở đây: NewsRespository chưa inject IAuditTrailService,
            // thêm dependency chỉ để ghi log một thao tác là mở rộng phạm vi không cần
            // thiết. Nếu sau này cần vết cho thao tác ghim thì thêm một lượt cho cả
            // Create/Update/Like luôn, chứ không riêng chỗ này.

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

            if (!CanViewNews(objNews))
            {
                apiResponse.CatchException(false, "LikeNews.NewsIsNotExist", requestClient);
                return apiResponse;
            }
            #endregion

            #region // Save into Database
            LikeNewsModel objLikeNews = new LikeNewsModel();
            bool isExistRecordLikeNews = CheckLikeNewsExist(newsId, currentUserId, ref objLikeNews);

            bool liked;
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
                liked = true;
            }
            else
            {
                await _dbContext.LikeNews.Where(i => i.LikeNewsId == objLikeNews.LikeNewsId).ExecuteDeleteAsync();
                await _dbContext.SaveChangesAsync();
                liked = false;
            }

            // Xoá cache cho CẢ hai nhánh: trước đây chỉ nhánh bỏ like mới xoá, nên
            // sau khi like, tab "Yêu thích" vẫn sắp xếp theo số liệu cũ.
            string keyStoreManager = TConstValue.NewsRespository_Search;
            await DeleteCachedAsync(keyStoreManager);

            // Cache của Detail giữ LikeCount, không xoá thì số tim trên trang bài
            // viết đứng yên cho tới khi cache hết hạn.
            await DeleteCachedAsync(GenerateUniqueCacheKey(TConstValue.NewsRespository_Detail, $"({newsId})"));
            #endregion

            // Trả lại trạng thái mới để client khỏi phải gọi thêm Detail.
            apiResponse.objResult = new LikeNewsResultDto
            {
                NewsId = objNews.NewsId,
                Liked = liked,
                LikeCount = _dbContext.LikeNews.AsNoTracking().Count(i => i.NewsId == objNews.NewsId)
            };

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

            if (!CanViewNews(objNews))
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
                await _dbContext.PointNews.AddAsync(new PointNewsModel
                {
                    NewsId = objNews.NewsId,
                    UserId = currentUserId,
                    Point = pointVal,
                    FlagActive = true,
                    CreatedDTime = TCommonUtils.DTimeNow(),
                    UpdatedDTime = TCommonUtils.DTimeNow()
                });
                await _dbContext.SaveChangesAsync();
            }
            else
            {
                // Chấm lại thì ghi đè điểm cũ chứ không thêm bản ghi mới - khóa chính
                // là cặp (NewsId, UserId) nên mỗi người chỉ có đúng 1 điểm cho 1 bài.
                await _dbContext.PointNews
                    .Where(i => i.NewsId == objNews.NewsId && i.UserId == currentUserId)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(i => i.Point, pointVal)
                        .SetProperty(i => i.UpdatedDTime, TCommonUtils.DTimeNow()));
            }

            // delete cached search api
            string keyStoreManager = TConstValue.NewsRespository_Search;
            await DeleteCachedAsync(keyStoreManager);

            // Cache của Detail giữ cả AvgPoint/TotalPoint, không xoá thì điểm trung
            // bình trên trang bài viết đứng yên cho tới khi cache hết hạn.
            await DeleteCachedAsync(GenerateUniqueCacheKey(TConstValue.NewsRespository_Detail, $"({newsId})"));
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
            string ShortTitleEn = TCommonUtils.PureString(data.ShortTitleEn);
            string SlugEn = TCommonUtils.IsNullOrEmpty(ShortTitleEn)
                ? string.Empty
                : TCommonUtils.GenerateSlug(ShortTitleEn);
            string Thumbnail = TCommonUtils.PureString(data.Thumbnail);
            string ShortTitle = TCommonUtils.PureString(data.ShortTitle);
            string ShortDescription = TCommonUtils.PureString(data.ShortDescription);
            string ShortDescriptionEn = TCommonUtils.PureString(data.ShortDescriptionEn);
            string ContentBody = data.ContentBody;
            string ContentBodyEn = data.ContentBodyEn ?? string.Empty;
            DateTime UpdatedDTime = TCommonUtils.DTimeNow();
            EWhoCanSee WhoCanSee = data.WhoCanSee;
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

            if (!Enum.IsDefined(WhoCanSee))
            {
                apiResponse.CatchException(false, "News_Update.WhoCanSeeIsNotValid", requestClient);
                return apiResponse;
            }

            bool hasEnglishHashtags = data.LstHashTagNewsEn?.Any(i => !TCommonUtils.IsNullOrEmpty(i.HashTagNewsName)) == true;
            bool hasVietnameseHashtags = data.LstHashTagNews?.Any(i => !TCommonUtils.IsNullOrEmpty(i.HashTagNewsName)) == true;
            bool hasAnyEnglishContent = !TCommonUtils.IsNullOrEmpty(ShortTitleEn)
                                        || !TCommonUtils.IsNullOrEmpty(ShortDescriptionEn)
                                        || !TCommonUtils.IsNullOrEmpty(ContentBodyEn)
                                        || hasEnglishHashtags;
            bool hasCompleteEnglishContent = !TCommonUtils.IsNullOrEmpty(ShortTitleEn)
                                             && !TCommonUtils.IsNullOrEmpty(ShortDescriptionEn)
                                             && !TCommonUtils.IsNullOrEmpty(ContentBodyEn);
            if (hasAnyEnglishContent && !hasCompleteEnglishContent)
            {
                apiResponse.CatchException(false, "News_Update.EnglishTranslationIsIncomplete", requestClient);
                return apiResponse;
            }

            if (hasCompleteEnglishContent && hasVietnameseHashtags && !hasEnglishHashtags)
            {
                apiResponse.CatchException(false, "News_Update.EnglishHashtagsAreRequired", requestClient);
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
            existingNews.SlugEn = SlugEn;
            existingNews.Thumbnail = Thumbnail;
            existingNews.ShortTitle = ShortTitle;
            existingNews.ShortTitleEn = ShortTitleEn;
            existingNews.ShortDescription = ShortDescription;
            existingNews.ShortDescriptionEn = ShortDescriptionEn;
            existingNews.ContentBody = ContentBody;
            existingNews.ContentBodyEn = ContentBodyEn;
            existingNews.UpdatedDTime = UpdatedDTime;
            existingNews.FlagActive = data.FlagActive;
            existingNews.WhoCanSee = WhoCanSee;

            // Khi chuyển bài đang ghim sang nháp/riêng tư, bỏ ghim ngay để bài
            // không tự xuất hiện lại nếu sau này đổi trạng thái mà chưa duyệt lại.
            if (!existingNews.FlagActive || existingNews.WhoCanSee != EWhoCanSee.Public)
            {
                existingNews.IsPinned = false;
                existingNews.PinOrder = 0;
            }

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

            // Add hashtag của cả hai ngôn ngữ sau khi đã loại rỗng/trùng.
            List<HashTagNewsModel> newHashTags = BuildHashTagModels(newsId, data.LstHashTagNews, "vi")
                .Concat(BuildHashTagModels(newsId, data.LstHashTagNewsEn, "en"))
                .ToList();

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
                await DeleteCachedAsync(TConstValue.NewsRespository_CategoryPreview);
                await DeleteCachedAsync(GenerateUniqueCacheKey(TConstValue.NewsRespository_Detail, $"({newsId})"));

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
