using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;

namespace angnet.Infrastructure.Data.Services
{
    public class AnimeService : IAnimeService
    {
        private const string AniListEndpoint = "https://graphql.anilist.co";
        private readonly AppDbContext _dbContext;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IMemoryCache _cache;

        public AnimeService(
            AppDbContext dbContext,
            IHttpClientFactory httpClientFactory,
            IMemoryCache cache)
        {
            _dbContext = dbContext;
            _httpClientFactory = httpClientFactory;
            _cache = cache;
        }

        public async Task<ApiResponse<AnimeSearchItemDto>> Search(string keyword, int page, int pageSize)
        {
            keyword = (keyword ?? string.Empty).Trim();
            if (keyword.Length < 2)
            {
                return new ApiResponse<AnimeSearchItemDto>("Vui lòng nhập ít nhất 2 ký tự để tìm kiếm.");
            }

            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 24);

            const string query = """
                query ($search: String!, $page: Int!, $perPage: Int!) {
                  Page(page: $page, perPage: $perPage) {
                    media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
                      id
                      title { romaji english native }
                      coverImage { extraLarge large }
                      bannerImage
                      format
                      status
                      seasonYear
                      episodes
                      averageScore
                    }
                  }
                }
                """;

            string cacheKey = $"anime:search:{keyword.ToLowerInvariant()}:{page}:{pageSize}";
            using JsonDocument document = await SendAniList(
                query,
                new { search = keyword, page, perPage = pageSize },
                cacheKey,
                TimeSpan.FromMinutes(5));
            JsonElement media = document.RootElement.GetProperty("data").GetProperty("Page").GetProperty("media");

            List<AnimeSearchItemDto> items = media.EnumerateArray().Select(MapSearchItem).ToList();
            return new ApiResponse<AnimeSearchItemDto> { DataList = items };
        }

        public async Task<ApiResponse<AnimeDetailDto>> GetDetail(int aniListId)
        {
            if (aniListId <= 0)
            {
                return new ApiResponse<AnimeDetailDto>("Mã anime không hợp lệ.");
            }

            const string query = """
                query ($id: Int!) {
                  Media(id: $id, type: ANIME) {
                    id
                    title { romaji english native }
                    description(asHtml: false)
                    coverImage { extraLarge large }
                    bannerImage
                    format
                    status
                    seasonYear
                    episodes
                    averageScore
                    genres
                    nextAiringEpisode { episode }
                  }
                }
                """;

            using JsonDocument document = await SendAniList(
                query,
                new { id = aniListId },
                $"anime:detail:{aniListId}",
                TimeSpan.FromHours(1));
            JsonElement media = document.RootElement.GetProperty("data").GetProperty("Media");
            AnimeSearchItemDto summary = MapSearchItem(media);

            int? episodeCount = summary.EpisodeCount;
            if (!episodeCount.HasValue
                && media.TryGetProperty("nextAiringEpisode", out JsonElement next)
                && next.ValueKind == JsonValueKind.Object
                && next.TryGetProperty("episode", out JsonElement nextEpisode)
                && nextEpisode.TryGetInt32(out int upcoming))
            {
                episodeCount = Math.Max(0, upcoming - 1);
            }

            AnimeModel anime = await UpsertAnime(media, summary, episodeCount);
            Dictionary<int, AnimeEpisodeModel> storedEpisodes = await _dbContext.AnimeEpisode
                .AsNoTracking()
                .Where(x => x.AnimeId == anime.AnimeId && x.FlagActive)
                .ToDictionaryAsync(x => x.EpisodeNumber);

            int totalEpisodes = Math.Max(
                episodeCount ?? 0,
                storedEpisodes.Keys.DefaultIfEmpty(0).Max());

            HashSet<string> episodeIds = storedEpisodes.Values.Select(x => x.EpisodeId).ToHashSet();
            HashSet<string> playableEpisodeIds = episodeIds.Count == 0
                ? new HashSet<string>()
                : (await _dbContext.AnimeSource.AsNoTracking()
                    .Where(x => episodeIds.Contains(x.EpisodeId) && x.FlagActive)
                    .Select(x => x.EpisodeId)
                    .Distinct()
                    .ToListAsync()).ToHashSet();

            List<AnimeEpisodeDto> episodes = new();
            for (int number = 1; number <= totalEpisodes; number++)
            {
                storedEpisodes.TryGetValue(number, out AnimeEpisodeModel? stored);
                episodes.Add(new AnimeEpisodeDto
                {
                    EpisodeNumber = number,
                    Title = string.IsNullOrWhiteSpace(stored?.Title) ? $"Tập {number}" : stored.Title,
                    ThumbnailUrl = stored?.ThumbnailUrl ?? string.Empty,
                    DurationSeconds = stored?.DurationSeconds,
                    HasSource = stored is not null && playableEpisodeIds.Contains(stored.EpisodeId),
                });
            }

            return new ApiResponse<AnimeDetailDto>(new AnimeDetailDto
            {
                AniListId = summary.AniListId,
                Title = summary.Title,
                NativeTitle = summary.NativeTitle,
                CoverImageUrl = summary.CoverImageUrl,
                BannerImageUrl = summary.BannerImageUrl,
                Format = summary.Format,
                Status = summary.Status,
                ReleaseYear = summary.ReleaseYear,
                EpisodeCount = totalEpisodes > 0 ? totalEpisodes : episodeCount,
                AverageScore = summary.AverageScore,
                Description = PlainText(StringValue(media, "description")),
                Genres = media.TryGetProperty("genres", out JsonElement genres)
                    ? genres.EnumerateArray().Select(x => x.GetString() ?? string.Empty).Where(x => x.Length > 0).ToList()
                    : new List<string>(),
                Episodes = episodes,
            });
        }

        public async Task<ApiResponse<AnimePlaybackDto>> GetPlayback(int aniListId, int episodeNumber)
        {
            if (aniListId <= 0 || episodeNumber <= 0)
            {
                return new ApiResponse<AnimePlaybackDto>("Tập phim không hợp lệ.");
            }

            var source = await (
                from anime in _dbContext.Anime.AsNoTracking()
                join episode in _dbContext.AnimeEpisode.AsNoTracking() on anime.AnimeId equals episode.AnimeId
                join item in _dbContext.AnimeSource.AsNoTracking() on episode.EpisodeId equals item.EpisodeId
                where anime.AniListId == aniListId
                    && episode.EpisodeNumber == episodeNumber
                    && anime.FlagActive && episode.FlagActive && item.FlagActive
                orderby item.Priority, item.SourceId
                select new { episode, item }
            ).FirstOrDefaultAsync();

            if (source is null)
            {
                return new ApiResponse<AnimePlaybackDto>("Tập phim này chưa có nguồn phát.");
            }

            string provider = source.item.Provider.Trim().ToLowerInvariant();
            string url;
            bool isEmbed;
            string mimeType;

            switch (provider)
            {
                case "youtube":
                    string videoId = ExtractYouTubeId(source.item.SourceValue);
                    if (string.IsNullOrWhiteSpace(videoId))
                    {
                        return new ApiResponse<AnimePlaybackDto>("Nguồn YouTube không hợp lệ.");
                    }
                    url = $"https://www.youtube-nocookie.com/embed/{videoId}?autoplay=1&rel=0";
                    isEmbed = true;
                    mimeType = "text/html";
                    break;
                case "mp4":
                    if (!IsHttpsUrl(source.item.SourceValue))
                    {
                        return new ApiResponse<AnimePlaybackDto>("Nguồn video không hợp lệ.");
                    }
                    url = source.item.SourceValue;
                    isEmbed = false;
                    mimeType = "video/mp4";
                    break;
                case "hls":
                    if (!IsHttpsUrl(source.item.SourceValue))
                    {
                        return new ApiResponse<AnimePlaybackDto>("Nguồn video không hợp lệ.");
                    }
                    url = source.item.SourceValue;
                    isEmbed = false;
                    mimeType = "application/vnd.apple.mpegurl";
                    break;
                default:
                    return new ApiResponse<AnimePlaybackDto>("Nhà cung cấp nguồn phát chưa được hỗ trợ.");
            }

            return new ApiResponse<AnimePlaybackDto>(new AnimePlaybackDto
            {
                AniListId = aniListId,
                EpisodeNumber = episodeNumber,
                Title = string.IsNullOrWhiteSpace(source.episode.Title)
                    ? $"Tập {episodeNumber}"
                    : source.episode.Title,
                Provider = provider,
                Url = url,
                IsEmbed = isEmbed,
                MimeType = mimeType,
            });
        }

        public async Task<ApiResponse<AnimeAdminCatalogDto>> GetAdminCatalog(string keyword)
        {
            keyword = (keyword ?? string.Empty).Trim();
            IQueryable<AnimeModel> query = _dbContext.Anime.AsNoTracking();
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                string pattern = $"%{keyword}%";
                query = query.Where(x => EF.Functions.ILike(x.Title, pattern)
                    || EF.Functions.ILike(x.NativeTitle, pattern));
            }

            List<AnimeAdminCatalogDto> items = await query
                .OrderByDescending(x => x.UpdatedDTime)
                .Select(x => new AnimeAdminCatalogDto
                {
                    AnimeId = x.AnimeId,
                    AniListId = x.AniListId,
                    Title = x.Title,
                    NativeTitle = x.NativeTitle,
                    CoverImageUrl = x.CoverImageUrl,
                    BannerImageUrl = x.BannerImageUrl,
                    Format = x.Format,
                    Status = x.Status,
                    ReleaseYear = x.ReleaseYear,
                    EpisodeCount = x.EpisodeCount,
                    StoredEpisodeCount = _dbContext.AnimeEpisode.Count(e => e.AnimeId == x.AnimeId),
                    PlayableEpisodeCount = _dbContext.AnimeEpisode
                        .Where(e => e.AnimeId == x.AnimeId)
                        .Count(e => _dbContext.AnimeSource.Any(s => s.EpisodeId == e.EpisodeId && s.FlagActive)),
                    FlagActive = x.FlagActive,
                    UpdatedDTime = x.UpdatedDTime,
                })
                .ToListAsync();

            return new ApiResponse<AnimeAdminCatalogDto> { DataList = items };
        }

        public async Task<ApiResponse<AnimeDetailDto>> Import(int aniListId, string actorId)
        {
            ApiResponse<AnimeDetailDto> detailResponse = await GetDetail(aniListId);
            if (!detailResponse.Success) return detailResponse;

            AnimeModel? anime = await _dbContext.Anime.FirstOrDefaultAsync(x => x.AniListId == aniListId);
            if (anime is null)
            {
                return new ApiResponse<AnimeDetailDto>("Không thể lưu anime vào hệ thống.");
            }

            HashSet<int> existingNumbers = (await _dbContext.AnimeEpisode
                .Where(x => x.AnimeId == anime.AnimeId)
                .Select(x => x.EpisodeNumber)
                .ToListAsync()).ToHashSet();

            DateTime now = TCommonUtils.DTimeNow();
            List<AnimeEpisodeModel> newEpisodes = detailResponse.Data.Episodes
                .Where(x => !existingNumbers.Contains(x.EpisodeNumber))
                .Select(x => new AnimeEpisodeModel
                {
                    AnimeId = anime.AnimeId,
                    EpisodeNumber = x.EpisodeNumber,
                    Title = x.Title,
                    ThumbnailUrl = x.ThumbnailUrl,
                    DurationSeconds = x.DurationSeconds,
                    SortOrder = x.EpisodeNumber,
                    FlagActive = true,
                    CreatedBy = actorId,
                    UpdatedBy = actorId,
                    CreatedDTime = now,
                    UpdatedDTime = now,
                })
                .ToList();

            if (newEpisodes.Count > 0)
            {
                await _dbContext.AnimeEpisode.AddRangeAsync(newEpisodes);
            }
            anime.UpdatedBy = actorId;
            anime.UpdatedDTime = now;
            await _dbContext.SaveChangesAsync();
            return detailResponse;
        }

        public async Task<ApiResponse<AnimeAdminEpisodeDto>> GetAdminEpisodes(int aniListId)
        {
            AnimeModel? anime = await _dbContext.Anime.AsNoTracking()
                .FirstOrDefaultAsync(x => x.AniListId == aniListId);
            if (anime is null)
            {
                return new ApiResponse<AnimeAdminEpisodeDto>("Anime chưa được nhập vào hệ thống.");
            }

            List<AnimeAdminEpisodeDto> episodes = await _dbContext.AnimeEpisode.AsNoTracking()
                .Where(x => x.AnimeId == anime.AnimeId)
                .OrderBy(x => x.SortOrder)
                .ThenBy(x => x.EpisodeNumber)
                .Select(x => new AnimeAdminEpisodeDto
                {
                    EpisodeId = x.EpisodeId,
                    EpisodeNumber = x.EpisodeNumber,
                    Title = x.Title,
                    ThumbnailUrl = x.ThumbnailUrl,
                    DurationSeconds = x.DurationSeconds,
                    FlagActive = x.FlagActive,
                    Sources = _dbContext.AnimeSource.AsNoTracking()
                        .Where(s => s.EpisodeId == x.EpisodeId)
                        .OrderBy(s => s.Priority)
                        .Select(s => new AnimeSourceDto
                        {
                            SourceId = s.SourceId,
                            Provider = s.Provider,
                            SourceValue = s.SourceValue,
                            Quality = s.Quality,
                            Language = s.Language,
                            Priority = s.Priority,
                            FlagActive = s.FlagActive,
                        })
                        .ToList(),
                })
                .ToListAsync();

            return new ApiResponse<AnimeAdminEpisodeDto> { DataList = episodes };
        }

        public async Task<ApiResponse<AnimeSourceDto>> SaveSource(AnimeSourceSaveDto data, string actorId)
        {
            if (data is null || data.AniListId <= 0 || data.EpisodeNumber <= 0)
                return new ApiResponse<AnimeSourceDto>("Thông tin tập phim không hợp lệ.");

            string provider = (data.Provider ?? string.Empty).Trim().ToLowerInvariant();
            string sourceValue = (data.SourceValue ?? string.Empty).Trim();
            if (provider is not ("youtube" or "mp4" or "hls"))
                return new ApiResponse<AnimeSourceDto>("Nguồn phát chỉ hỗ trợ YouTube, MP4 hoặc HLS.");
            if (provider == "youtube" && string.IsNullOrWhiteSpace(ExtractYouTubeId(sourceValue)))
                return new ApiResponse<AnimeSourceDto>("Link hoặc video ID YouTube không hợp lệ.");
            if (provider != "youtube" && !IsHttpsUrl(sourceValue))
                return new ApiResponse<AnimeSourceDto>("Nguồn MP4/HLS phải là đường dẫn HTTPS hợp lệ.");
            if (sourceValue.Length > 2000)
                return new ApiResponse<AnimeSourceDto>("Đường dẫn nguồn phát quá dài.");
            if ((data.EpisodeTitle ?? string.Empty).Trim().Length > 300)
                return new ApiResponse<AnimeSourceDto>("Tiêu đề tập không được vượt quá 300 ký tự.");
            if ((data.Quality ?? string.Empty).Trim().Length > 30)
                return new ApiResponse<AnimeSourceDto>("Chất lượng không được vượt quá 30 ký tự.");
            if ((data.Language ?? string.Empty).Trim().Length > 100)
                return new ApiResponse<AnimeSourceDto>("Ngôn ngữ không được vượt quá 100 ký tự.");

            AnimeModel? anime = await _dbContext.Anime.FirstOrDefaultAsync(x => x.AniListId == data.AniListId);
            if (anime is null)
                return new ApiResponse<AnimeSourceDto>("Anime chưa được nhập vào hệ thống.");

            DateTime now = TCommonUtils.DTimeNow();
            AnimeEpisodeModel? episode = await _dbContext.AnimeEpisode
                .FirstOrDefaultAsync(x => x.AnimeId == anime.AnimeId && x.EpisodeNumber == data.EpisodeNumber);
            if (episode is null)
            {
                episode = new AnimeEpisodeModel
                {
                    AnimeId = anime.AnimeId,
                    EpisodeNumber = data.EpisodeNumber,
                    SortOrder = data.EpisodeNumber,
                    FlagActive = true,
                    CreatedBy = actorId,
                    CreatedDTime = now,
                };
                await _dbContext.AnimeEpisode.AddAsync(episode);
            }

            episode.Title = string.IsNullOrWhiteSpace(data.EpisodeTitle)
                ? $"Tập {data.EpisodeNumber}"
                : data.EpisodeTitle.Trim();
            episode.UpdatedBy = actorId;
            episode.UpdatedDTime = now;

            AnimeSourceModel? source = string.IsNullOrWhiteSpace(data.SourceId)
                ? null
                : await _dbContext.AnimeSource.FirstOrDefaultAsync(x => x.SourceId == data.SourceId && x.EpisodeId == episode.EpisodeId);
            if (!string.IsNullOrWhiteSpace(data.SourceId) && source is null)
                return new ApiResponse<AnimeSourceDto>("Nguồn phát không tồn tại.");

            if (source is null)
            {
                source = new AnimeSourceModel
                {
                    EpisodeId = episode.EpisodeId,
                    CreatedBy = actorId,
                    CreatedDTime = now,
                };
                await _dbContext.AnimeSource.AddAsync(source);
            }

            source.Provider = provider;
            source.SourceValue = sourceValue;
            source.Quality = (data.Quality ?? string.Empty).Trim();
            source.Language = (data.Language ?? string.Empty).Trim();
            source.Priority = Math.Max(0, data.Priority);
            source.FlagActive = data.FlagActive;
            source.UpdatedBy = actorId;
            source.UpdatedDTime = now;
            await _dbContext.SaveChangesAsync();

            return new ApiResponse<AnimeSourceDto>(MapSource(source));
        }

        public async Task<ApiResponse<AnimeSourceDto>> ToggleSource(string sourceId, bool flagActive, string actorId)
        {
            AnimeSourceModel? source = await _dbContext.AnimeSource.FirstOrDefaultAsync(x => x.SourceId == sourceId);
            if (source is null) return new ApiResponse<AnimeSourceDto>("Nguồn phát không tồn tại.");

            source.FlagActive = flagActive;
            source.UpdatedBy = actorId;
            source.UpdatedDTime = TCommonUtils.DTimeNow();
            await _dbContext.SaveChangesAsync();
            return new ApiResponse<AnimeSourceDto>(MapSource(source));
        }

        public async Task<ApiResponse<bool>> DeleteSource(string sourceId)
        {
            AnimeSourceModel? source = await _dbContext.AnimeSource.FirstOrDefaultAsync(x => x.SourceId == sourceId);
            if (source is null) return new ApiResponse<bool>("Nguồn phát không tồn tại.");

            _dbContext.AnimeSource.Remove(source);
            await _dbContext.SaveChangesAsync();
            return new ApiResponse<bool>(true);
        }

        private async Task<JsonDocument> SendAniList(
            string query,
            object variables,
            string cacheKey,
            TimeSpan cacheDuration)
        {
            if (_cache.TryGetValue(cacheKey, out string? cachedJson)
                && !string.IsNullOrWhiteSpace(cachedJson))
            {
                return JsonDocument.Parse(cachedJson);
            }

            HttpClient client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(15);
            using HttpResponseMessage response = await client.PostAsJsonAsync(AniListEndpoint, new { query, variables });
            response.EnsureSuccessStatusCode();

            string json = await response.Content.ReadAsStringAsync();
            JsonDocument document = JsonDocument.Parse(json);
            if (document.RootElement.TryGetProperty("errors", out JsonElement errors))
            {
                string message = errors.EnumerateArray().FirstOrDefault().TryGetProperty("message", out JsonElement error)
                    ? error.GetString() ?? "AniList trả về lỗi."
                    : "AniList trả về lỗi.";
                document.Dispose();
                throw new InvalidOperationException(message);
            }
            _cache.Set(cacheKey, json, cacheDuration);
            return document;
        }

        private async Task<AnimeModel> UpsertAnime(JsonElement media, AnimeSearchItemDto summary, int? episodeCount)
        {
            AnimeModel? anime = await _dbContext.Anime.FirstOrDefaultAsync(x => x.AniListId == summary.AniListId);
            DateTime now = TCommonUtils.DTimeNow();
            if (anime is null)
            {
                anime = new AnimeModel
                {
                    AniListId = summary.AniListId,
                    CreatedBy = "anilist",
                    CreatedDTime = now,
                    FlagActive = true,
                };
                await _dbContext.Anime.AddAsync(anime);
            }

            anime.Title = summary.Title;
            anime.NativeTitle = summary.NativeTitle;
            anime.Description = PlainText(StringValue(media, "description"));
            anime.CoverImageUrl = summary.CoverImageUrl;
            anime.BannerImageUrl = summary.BannerImageUrl;
            anime.Format = summary.Format;
            anime.Status = summary.Status;
            anime.ReleaseYear = summary.ReleaseYear;
            anime.EpisodeCount = episodeCount;
            anime.UpdatedBy = "anilist";
            anime.UpdatedDTime = now;
            await _dbContext.SaveChangesAsync();
            return anime;
        }

        private static AnimeSearchItemDto MapSearchItem(JsonElement media)
        {
            JsonElement title = media.GetProperty("title");
            JsonElement cover = media.GetProperty("coverImage");
            string displayTitle = StringValue(title, "english");
            if (string.IsNullOrWhiteSpace(displayTitle)) displayTitle = StringValue(title, "romaji");

            return new AnimeSearchItemDto
            {
                AniListId = media.GetProperty("id").GetInt32(),
                Title = displayTitle,
                NativeTitle = StringValue(title, "native"),
                CoverImageUrl = FirstNonEmpty(StringValue(cover, "extraLarge"), StringValue(cover, "large")),
                BannerImageUrl = StringValue(media, "bannerImage"),
                Format = StringValue(media, "format"),
                Status = StringValue(media, "status"),
                ReleaseYear = NullableInt(media, "seasonYear"),
                EpisodeCount = NullableInt(media, "episodes"),
                AverageScore = NullableInt(media, "averageScore"),
            };
        }

        private static string StringValue(JsonElement element, string property)
        {
            return element.TryGetProperty(property, out JsonElement value) && value.ValueKind == JsonValueKind.String
                ? value.GetString() ?? string.Empty
                : string.Empty;
        }

        private static int? NullableInt(JsonElement element, string property)
        {
            return element.TryGetProperty(property, out JsonElement value) && value.TryGetInt32(out int number)
                ? number
                : null;
        }

        private static string FirstNonEmpty(params string[] values) => values.FirstOrDefault(x => !string.IsNullOrWhiteSpace(x)) ?? string.Empty;

        private static string PlainText(string value)
        {
            string withoutTags = Regex.Replace(value ?? string.Empty, "<[^>]+>", " ");
            return Regex.Replace(WebUtility.HtmlDecode(withoutTags), @"\s+", " ").Trim();
        }

        private static bool IsHttpsUrl(string value)
        {
            return Uri.TryCreate(value, UriKind.Absolute, out Uri? uri) && uri.Scheme == Uri.UriSchemeHttps;
        }

        private static string ExtractYouTubeId(string value)
        {
            value = (value ?? string.Empty).Trim();
            if (Regex.IsMatch(value, @"^[A-Za-z0-9_-]{11}$")) return value;
            if (!Uri.TryCreate(value, UriKind.Absolute, out Uri? uri)) return string.Empty;

            if (uri.Host.EndsWith("youtu.be", StringComparison.OrdinalIgnoreCase))
                return uri.AbsolutePath.Trim('/').Split('/').FirstOrDefault() ?? string.Empty;

            if (!uri.Host.EndsWith("youtube.com", StringComparison.OrdinalIgnoreCase)
                && !uri.Host.EndsWith("youtube-nocookie.com", StringComparison.OrdinalIgnoreCase))
                return string.Empty;

            if (uri.AbsolutePath.StartsWith("/embed/", StringComparison.OrdinalIgnoreCase))
                return uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries).LastOrDefault() ?? string.Empty;

            string query = uri.Query.TrimStart('?');
            return query.Split('&', StringSplitOptions.RemoveEmptyEntries)
                .Select(x => x.Split('=', 2))
                .Where(x => x.Length == 2 && x[0] == "v")
                .Select(x => Uri.UnescapeDataString(x[1]))
                .FirstOrDefault() ?? string.Empty;
        }

        private static AnimeSourceDto MapSource(AnimeSourceModel source)
        {
            return new AnimeSourceDto
            {
                SourceId = source.SourceId,
                Provider = source.Provider,
                SourceValue = source.SourceValue,
                Quality = source.Quality,
                Language = source.Language,
                Priority = source.Priority,
                FlagActive = source.FlagActive,
            };
        }
    }
}
