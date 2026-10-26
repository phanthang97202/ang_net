using System.Text.Json;
using angnet.Domain.Dtos;
using angnet.Domain.Enums;
using angnet.Domain.Models;
using Microsoft.EntityFrameworkCore;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;

namespace angnet.Infrastructure.Data.Services
{
    public interface IMusicLibraryService
    {
        Task<ApiResponse<MusicTrackDto>> GetSavedAsync(string userId, int pageIndex, int pageSize);
        Task<ApiResponse<MusicTrackKeyDto>> GetSaveStateAsync(string userId, MusicSaveStateRequestDto data);
        Task<ApiResponse<MusicTrackDto>> SaveAsync(string userId, MusicTrackKeyDto data, CancellationToken cancellationToken);
        Task<ApiResponse<bool>> UnsaveAsync(string userId, string trackId);
        Task<ApiResponse<MusicCollectionDto>> GetMyCollectionsAsync(string userId, EMusicProvider? provider, string externalId);
        Task<ApiResponse<MusicCollectionDto>> GetCollectionAsync(string viewerId, string collectionId);
        Task<ApiResponse<MusicTrackDto>> GetCollectionTracksAsync(string viewerId, string collectionId, int pageIndex, int pageSize);
        Task<ApiResponse<MusicCollectionDto>> CreateCollectionAsync(string userId, MusicCollectionSaveDto data);
        Task<ApiResponse<MusicCollectionDto>> UpdateCollectionAsync(string userId, MusicCollectionSaveDto data);
        Task<ApiResponse<bool>> DeleteCollectionAsync(string userId, string collectionId);
        Task<ApiResponse<MusicTrackDto>> AddToCollectionAsync(string userId, MusicCollectionItemAddDto data, CancellationToken cancellationToken);
        Task<ApiResponse<bool>> RemoveFromCollectionAsync(string userId, string collectionId, string trackId);
        Task<ApiResponse<bool>> MoveCollectionItemAsync(string userId, MusicCollectionItemMoveDto data);
    }

    /*
        Thư viện nhạc: nút Lưu + bộ sưu tập nhạc, giống TikTok.

        - Lưu một bài = upsert vào danh mục dùng chung MusicTrack (metadata server tự
          lấy qua IMusicTrackSource) + thêm dòng MusicSave của người đó.
        - Thêm vào bộ thì bài cũng tự vào "Đã lưu". Bỏ lưu thì bài bị gỡ khỏi mọi bộ
          của người đó.

        Hai lớp quyền giống ArchiveService:
          1. Permission "music.use" (gác ở controller).
          2. OwnerId (kiểm tra ở đây): chỉ sửa đồ của chính mình, và bộ Private chỉ
             chủ sở hữu xem được - không có nhánh nào cho Admin.
        Bộ không xem được trả về đúng câu "không tồn tại" như bộ thật sự không có.
    */
    public class MusicLibraryService : IMusicLibraryService
    {
        private const int NameMaxLength = 150;
        private const int DescriptionMaxLength = 2000;
        private const int MaxPageSize = 100;
        private const int MaxStateLookup = 100;

        // Chặn lạm dụng; đủ rộng cho người nghe nhạc bình thường
        private const int MaxSavesPerUser = 5000;
        private const int MaxCollectionsPerUser = 100;
        private const int MaxItemsPerCollection = 1000;

        private const int SortOrderStep = 1000;

        // Bản chụp metadata cũ hơn mức này thì hỏi lại nguồn khi có người lưu
        private static readonly TimeSpan RefreshAfter = TimeSpan.FromDays(7);

        private const string CollectionNotFound = "Bộ sưu tập không tồn tại";
        private const string TrackUnavailable = "Bài hát không còn tồn tại hoặc không cho phép phát nhúng";

        private readonly AppDbContext _dbContext;
        private readonly Dictionary<EMusicProvider, IMusicTrackSource> _sources;

        public MusicLibraryService(AppDbContext dbContext, IEnumerable<IMusicTrackSource> sources)
        {
            _dbContext = dbContext;
            _sources = sources.ToDictionary(s => s.Provider);
        }

        public async Task<ApiResponse<MusicTrackDto>> GetSavedAsync(string userId, int pageIndex, int pageSize)
        {
            (pageIndex, pageSize) = NormalizePage(pageIndex, pageSize);

            IQueryable<MusicSaveModel> query = _dbContext.MusicSave.AsNoTracking().Where(s => s.UserId == userId);
            int itemCount = await query.CountAsync();
            var rows = await (
                    from s in query
                    join t in _dbContext.MusicTrack on s.TrackId equals t.TrackId
                    orderby s.CreatedDTime descending, s.TrackId
                    select new { Track = t, AddedDTime = s.CreatedDTime })
                .Skip(pageIndex * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Page(rows.Select(r => ToDto(r.Track, r.AddedDTime)).ToList(), pageIndex, pageSize, itemCount);
        }

        public async Task<ApiResponse<MusicTrackKeyDto>> GetSaveStateAsync(string userId, MusicSaveStateRequestDto data)
        {
            // Bỏ qua khoá sai định dạng thay vì báo lỗi: danh sách đến từ kết quả tìm kiếm
            List<MusicTrackKeyDto> keys = (data?.Tracks ?? new List<MusicTrackKeyDto>())
                .Where(k => k != null && TryGetSource(k.Provider, k.ExternalId?.Trim(), out _))
                .Take(MaxStateLookup)
                .ToList();
            if (keys.Count == 0)
            {
                return new ApiResponse<MusicTrackKeyDto> { DataList = new List<MusicTrackKeyDto>() };
            }

            List<string> externalIds = keys.Select(k => k.ExternalId.Trim()).Distinct().ToList();
            var saved = await (
                    from s in _dbContext.MusicSave.AsNoTracking()
                    join t in _dbContext.MusicTrack on s.TrackId equals t.TrackId
                    where s.UserId == userId && externalIds.Contains(t.ExternalId)
                    select new { t.Provider, t.ExternalId, t.TrackId })
                .ToListAsync();

            HashSet<(EMusicProvider, string)> requested = keys.Select(k => (k.Provider, k.ExternalId.Trim())).ToHashSet();
            return new ApiResponse<MusicTrackKeyDto>
            {
                DataList = saved
                    .Where(s => requested.Contains((s.Provider, s.ExternalId)))
                    .Select(s => new MusicTrackKeyDto { Provider = s.Provider, ExternalId = s.ExternalId, TrackId = s.TrackId })
                    .ToList(),
            };
        }

        public async Task<ApiResponse<MusicTrackDto>> SaveAsync(string userId, MusicTrackKeyDto data, CancellationToken cancellationToken)
        {
            string externalId = data?.ExternalId?.Trim();
            if (data is null || !TryGetSource(data.Provider, externalId, out IMusicTrackSource source))
            {
                return new ApiResponse<MusicTrackDto>("Bài hát không hợp lệ");
            }

            (MusicTrackModel track, string error) = await EnsureTrackAsync(userId, source, externalId, cancellationToken);
            if (error != null)
            {
                return new ApiResponse<MusicTrackDto>(error);
            }

            error = await EnsureSavedAsync(userId, track.TrackId);
            return error != null
                ? new ApiResponse<MusicTrackDto>(error)
                : new ApiResponse<MusicTrackDto>(ToDto(track, TCommonUtils.DTimeNow()));
        }

        public async Task<ApiResponse<bool>> UnsaveAsync(string userId, string trackId)
        {
            if (TCommonUtils.IsNullOrEmpty(trackId))
            {
                return new ApiResponse<bool>("Bài hát không hợp lệ");
            }

            // Giống TikTok: bỏ lưu là gỡ khỏi mọi bộ của người đó, làm cùng một lần.
            // DbContext bật EnableRetryOnFailure (Program.cs) nên không được tự gọi
            // BeginTransaction trần - phải chạy trong CreateExecutionStrategy.
            var strategy = _dbContext.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _dbContext.Database.BeginTransactionAsync();
                await _dbContext.MusicCollectionItem
                    .Where(i => i.OwnerId == userId && i.TrackId == trackId)
                    .ExecuteDeleteAsync();
                await _dbContext.MusicSave
                    .Where(s => s.UserId == userId && s.TrackId == trackId)
                    .ExecuteDeleteAsync();
                await transaction.CommitAsync();
            });

            return new ApiResponse<bool>(true);
        }

        public async Task<ApiResponse<MusicCollectionDto>> GetMyCollectionsAsync(
            string userId, EMusicProvider? provider, string externalId)
        {
            // Modal "Thêm vào bộ sưu tập" hỏi kèm bài để đánh dấu bộ nào đã có bài đó
            string trackId = string.Empty;
            externalId = externalId?.Trim();
            if (provider.HasValue && !TCommonUtils.IsNullOrEmpty(externalId))
            {
                trackId = await _dbContext.MusicTrack.AsNoTracking()
                    .Where(t => t.Provider == provider.Value && t.ExternalId == externalId)
                    .Select(t => t.TrackId)
                    .FirstOrDefaultAsync() ?? string.Empty;
            }

            List<MusicCollectionDto> collections = await ProjectCollections(
                    _dbContext.MusicCollection.AsNoTracking().Where(c => c.OwnerId == userId), userId, trackId)
                .ToListAsync();

            return new ApiResponse<MusicCollectionDto> { DataList = collections };
        }

        public async Task<ApiResponse<MusicCollectionDto>> GetCollectionAsync(string viewerId, string collectionId)
        {
            MusicCollectionDto collection = await FindViewableCollection(viewerId, collectionId);
            return collection is null
                ? new ApiResponse<MusicCollectionDto>(CollectionNotFound)
                : new ApiResponse<MusicCollectionDto>(collection);
        }

        public async Task<ApiResponse<MusicTrackDto>> GetCollectionTracksAsync(
            string viewerId, string collectionId, int pageIndex, int pageSize)
        {
            if (await FindViewableCollection(viewerId, collectionId) is null)
            {
                return new ApiResponse<MusicTrackDto>(CollectionNotFound);
            }

            (pageIndex, pageSize) = NormalizePage(pageIndex, pageSize);

            IQueryable<MusicCollectionItemModel> query = _dbContext.MusicCollectionItem.AsNoTracking()
                .Where(i => i.CollectionId == collectionId);
            int itemCount = await query.CountAsync();
            var rows = await (
                    from i in query
                    join t in _dbContext.MusicTrack on i.TrackId equals t.TrackId
                    orderby i.SortOrder, i.AddedDTime descending
                    select new { Track = t, i.AddedDTime })
                .Skip(pageIndex * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Page(rows.Select(r => ToDto(r.Track, r.AddedDTime)).ToList(), pageIndex, pageSize, itemCount);
        }

        public async Task<ApiResponse<MusicCollectionDto>> CreateCollectionAsync(string userId, MusicCollectionSaveDto data)
        {
            string error = ValidateCollection(data);
            if (error != null)
            {
                return new ApiResponse<MusicCollectionDto>(error);
            }

            if (await _dbContext.MusicCollection.CountAsync(c => c.OwnerId == userId) >= MaxCollectionsPerUser)
            {
                return new ApiResponse<MusicCollectionDto>($"Mỗi người tối đa {MaxCollectionsPerUser} bộ sưu tập nhạc");
            }

            // Bộ mới nằm đầu danh sách, như TikTok
            int? minSortOrder = await _dbContext.MusicCollection
                .Where(c => c.OwnerId == userId)
                .MinAsync(c => (int?)c.SortOrder);

            DateTime now = TCommonUtils.DTimeNow();
            MusicCollectionModel collection = new MusicCollectionModel
            {
                OwnerId = userId,
                Name = data.Name.Trim(),
                Description = (data.Description ?? string.Empty).Trim(),
                Visibility = data.Visibility,
                SortOrder = (minSortOrder ?? 1) - 1,
                FlagActive = true,
                CreatedBy = userId,
                UpdatedBy = userId,
                CreatedDTime = now,
                UpdatedDTime = now,
            };

            await _dbContext.MusicCollection.AddAsync(collection);
            await _dbContext.SaveChangesAsync();

            return await GetCollectionAsync(userId, collection.CollectionId);
        }

        public async Task<ApiResponse<MusicCollectionDto>> UpdateCollectionAsync(string userId, MusicCollectionSaveDto data)
        {
            string error = ValidateCollection(data);
            if (error != null)
            {
                return new ApiResponse<MusicCollectionDto>(error);
            }

            MusicCollectionModel collection = await FindOwnedCollection(userId, data.CollectionId);
            if (collection is null)
            {
                return new ApiResponse<MusicCollectionDto>(CollectionNotFound);
            }

            collection.Name = data.Name.Trim();
            collection.Description = (data.Description ?? string.Empty).Trim();
            collection.Visibility = data.Visibility;
            collection.UpdatedBy = userId;
            collection.UpdatedDTime = TCommonUtils.DTimeNow();
            await _dbContext.SaveChangesAsync();

            return await GetCollectionAsync(userId, collection.CollectionId);
        }

        public async Task<ApiResponse<bool>> DeleteCollectionAsync(string userId, string collectionId)
        {
            // Xoá thẳng ở DB: bài trong bộ do khoá ngoại ON DELETE CASCADE tự xoá (bài
            // vẫn còn trong "Đã lưu"). Không Remove() qua change tracker, vì EF sẽ tự
            // cascade cả những MusicCollectionItem đang track mà có thể đã bị
            // ExecuteDelete xoá trước đó -> lỗi concurrency.
            int deleted = await _dbContext.MusicCollection
                .Where(c => c.CollectionId == collectionId && c.OwnerId == userId)
                .ExecuteDeleteAsync();

            return deleted == 0
                ? new ApiResponse<bool>(CollectionNotFound)
                : new ApiResponse<bool>(true);
        }

        public async Task<ApiResponse<MusicTrackDto>> AddToCollectionAsync(
            string userId, MusicCollectionItemAddDto data, CancellationToken cancellationToken)
        {
            string externalId = data?.ExternalId?.Trim();
            if (data is null || !TryGetSource(data.Provider, externalId, out IMusicTrackSource source))
            {
                return new ApiResponse<MusicTrackDto>("Bài hát không hợp lệ");
            }

            MusicCollectionModel collection = await FindOwnedCollection(userId, data.CollectionId);
            if (collection is null)
            {
                return new ApiResponse<MusicTrackDto>(CollectionNotFound);
            }

            if (await _dbContext.MusicCollectionItem.CountAsync(i => i.CollectionId == collection.CollectionId) >= MaxItemsPerCollection)
            {
                return new ApiResponse<MusicTrackDto>($"Mỗi bộ sưu tập tối đa {MaxItemsPerCollection} bài");
            }

            (MusicTrackModel track, string error) = await EnsureTrackAsync(userId, source, externalId, cancellationToken);
            if (error != null)
            {
                return new ApiResponse<MusicTrackDto>(error);
            }

            // Thêm vào bộ thì cũng nằm trong "Đã lưu", để bỏ lưu gỡ được ở mọi nơi
            error = await EnsureSavedAsync(userId, track.TrackId);
            if (error != null)
            {
                return new ApiResponse<MusicTrackDto>(error);
            }

            DateTime now = TCommonUtils.DTimeNow();
            // MIN() không GROUP BY luôn trả một dòng, kể cả khi bộ đang rỗng
            await _dbContext.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "MusicCollectionItem" ("CollectionId", "TrackId", "OwnerId", "SortOrder", "AddedDTime")
                SELECT {collection.CollectionId}, {track.TrackId}, {userId},
                       COALESCE(MIN("SortOrder"), 0) - {SortOrderStep}, {now}
                FROM "MusicCollectionItem"
                WHERE "CollectionId" = {collection.CollectionId}
                ON CONFLICT ("CollectionId", "TrackId") DO NOTHING
                """);

            collection.UpdatedBy = userId;
            collection.UpdatedDTime = now;
            await _dbContext.SaveChangesAsync();

            return new ApiResponse<MusicTrackDto>(ToDto(track, now));
        }

        public async Task<ApiResponse<bool>> RemoveFromCollectionAsync(string userId, string collectionId, string trackId)
        {
            MusicCollectionModel collection = await FindOwnedCollection(userId, collectionId);
            if (collection is null)
            {
                return new ApiResponse<bool>(CollectionNotFound);
            }

            // Chỉ gỡ khỏi bộ này, bài vẫn còn trong "Đã lưu"
            await _dbContext.MusicCollectionItem
                .Where(i => i.CollectionId == collectionId && i.TrackId == trackId)
                .ExecuteDeleteAsync();

            return new ApiResponse<bool>(true);
        }

        public async Task<ApiResponse<bool>> MoveCollectionItemAsync(string userId, MusicCollectionItemMoveDto data)
        {
            string direction = (data?.Direction ?? string.Empty).Trim().ToLower();
            if (data is null || (direction != "up" && direction != "down"))
            {
                return new ApiResponse<bool>("Hướng di chuyển không hợp lệ");
            }

            if (await FindOwnedCollection(userId, data.CollectionId) is null)
            {
                return new ApiResponse<bool>(CollectionNotFound);
            }

            List<MusicCollectionItemModel> items = await _dbContext.MusicCollectionItem
                .Where(i => i.CollectionId == data.CollectionId)
                .OrderBy(i => i.SortOrder)
                .ThenByDescending(i => i.AddedDTime)
                .ToListAsync();

            int currentPosition = items.FindIndex(i => i.TrackId == data.TrackId);
            if (currentPosition < 0)
            {
                return new ApiResponse<bool>("Bài hát không có trong bộ sưu tập");
            }

            int targetPosition = direction == "up" ? currentPosition - 1 : currentPosition + 1;
            if (targetPosition < 0 || targetPosition >= items.Count)
            {
                return new ApiResponse<bool>("Bài hát đã ở vị trí đầu/cuối");
            }

            MusicCollectionItemModel current = items[currentPosition];
            MusicCollectionItemModel target = items[targetPosition];
            if (current.SortOrder != target.SortOrder)
            {
                (current.SortOrder, target.SortOrder) = (target.SortOrder, current.SortOrder);
            }
            else
            {
                // Hai số trùng (hiếm, do thêm đồng thời): đánh lại cả bộ theo thứ tự mới
                items.RemoveAt(currentPosition);
                items.Insert(targetPosition, current);
                for (int index = 0; index < items.Count; index++)
                {
                    items[index].SortOrder = index * SortOrderStep;
                }
            }
            await _dbContext.SaveChangesAsync();

            return new ApiResponse<bool>(true);
        }

        /// <summary>
        /// Lấy bài trong danh mục dùng chung; chưa có hoặc bản chụp đã cũ thì hỏi lại
        /// nguồn. Nguồn lỗi tạm thời (mạng, timeout) mà đã có bản chụp thì dùng bản cũ.
        /// </summary>
        private async Task<(MusicTrackModel Track, string Error)> EnsureTrackAsync(
            string userId, IMusicTrackSource source, string externalId, CancellationToken cancellationToken)
        {
            MusicTrackModel existing = await _dbContext.MusicTrack.AsNoTracking()
                .FirstOrDefaultAsync(t => t.Provider == source.Provider && t.ExternalId == externalId, cancellationToken);

            DateTime now = TCommonUtils.DTimeNow();
            if (existing != null
                && existing.Availability == EMusicTrackAvailability.Available
                && existing.UpdatedDTime > now - RefreshAfter)
            {
                return (existing, null);
            }

            MusicTrackMetadata metadata;
            try
            {
                metadata = await source.FetchAsync(externalId, cancellationToken);
            }
            catch (MusicTrackUnavailableException)
            {
                if (existing != null && existing.Availability != EMusicTrackAvailability.Unavailable)
                {
                    await _dbContext.MusicTrack
                        .Where(t => t.TrackId == existing.TrackId)
                        .ExecuteUpdateAsync(setters => setters
                            .SetProperty(t => t.Availability, EMusicTrackAvailability.Unavailable)
                            .SetProperty(t => t.UpdatedBy, userId)
                            .SetProperty(t => t.UpdatedDTime, now), cancellationToken);
                }
                return (null, TrackUnavailable);
            }
            catch (Exception ex) when (!cancellationToken.IsCancellationRequested
                && ex is HttpRequestException or TaskCanceledException or JsonException)
            {
                return existing != null
                    ? (existing, null)
                    : (null, $"Không lấy được thông tin bài hát từ {source.Provider}, vui lòng thử lại");
            }

            string trackId = Guid.NewGuid().ToString();
            string provider = source.Provider.ToString();
            // Upsert nguyên tử: hai người lưu cùng một bài cùng lúc vẫn chỉ ra một dòng
            List<string> ids = await _dbContext.Database.SqlQuery<string>($"""
                INSERT INTO "MusicTrack" ("TrackId", "Provider", "ExternalId", "Title", "Artist", "ThumbnailUrl",
                    "DurationSeconds", "ExternalUrl", "Metadata", "Availability", "FlagActive",
                    "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime")
                VALUES ({trackId}, {provider}, {externalId}, {metadata.Title}, {metadata.Artist}, {metadata.ThumbnailUrl},
                    CAST({metadata.DurationSeconds} AS integer), {metadata.ExternalUrl}, CAST({metadata.Metadata} AS jsonb), 'Available', true,
                    {userId}, {userId}, {now}, {now})
                ON CONFLICT ("Provider", "ExternalId") DO UPDATE SET
                    "Title" = EXCLUDED."Title", "Artist" = EXCLUDED."Artist",
                    "ThumbnailUrl" = EXCLUDED."ThumbnailUrl", "DurationSeconds" = EXCLUDED."DurationSeconds",
                    "ExternalUrl" = EXCLUDED."ExternalUrl", "Metadata" = EXCLUDED."Metadata",
                    "Availability" = 'Available', "FlagActive" = true,
                    "UpdatedBy" = EXCLUDED."UpdatedBy", "UpdatedDTime" = EXCLUDED."UpdatedDTime"
                RETURNING "TrackId" AS "Value"
                """).ToListAsync(cancellationToken);

            return (new MusicTrackModel
            {
                TrackId = ids.Single(),
                Provider = source.Provider,
                ExternalId = externalId,
                Title = metadata.Title,
                Artist = metadata.Artist,
                ThumbnailUrl = metadata.ThumbnailUrl,
                DurationSeconds = metadata.DurationSeconds,
                ExternalUrl = metadata.ExternalUrl,
                Metadata = metadata.Metadata,
                Availability = EMusicTrackAvailability.Available,
            }, null);
        }

        private async Task<string> EnsureSavedAsync(string userId, string trackId)
        {
            bool alreadySaved = await _dbContext.MusicSave.AnyAsync(s => s.UserId == userId && s.TrackId == trackId);
            if (alreadySaved)
            {
                return null;
            }

            if (await _dbContext.MusicSave.CountAsync(s => s.UserId == userId) >= MaxSavesPerUser)
            {
                return $"Mỗi người lưu tối đa {MaxSavesPerUser} bài hát";
            }

            DateTime now = TCommonUtils.DTimeNow();
            await _dbContext.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "MusicSave" ("UserId", "TrackId", "CreatedDTime")
                VALUES ({userId}, {trackId}, {now})
                ON CONFLICT ("UserId", "TrackId") DO NOTHING
                """);
            return null;
        }

        private bool TryGetSource(EMusicProvider provider, string externalId, out IMusicTrackSource source)
        {
            return _sources.TryGetValue(provider, out source)
                && source.IsValidExternalId(externalId ?? string.Empty);
        }

        private async Task<MusicCollectionDto> FindViewableCollection(string viewerId, string collectionId)
        {
            if (TCommonUtils.IsNullOrEmpty(collectionId))
            {
                return null;
            }

            // Không có nhánh nào cho Admin: bộ Private chỉ chủ sở hữu thấy
            return await ProjectCollections(
                    _dbContext.MusicCollection.AsNoTracking().Where(c =>
                        c.CollectionId == collectionId
                        && (c.Visibility != EArchiveVisibility.Private || c.OwnerId == viewerId)),
                    viewerId,
                    string.Empty)
                .FirstOrDefaultAsync();
        }

        private Task<MusicCollectionModel> FindOwnedCollection(string userId, string collectionId)
        {
            return _dbContext.MusicCollection
                .FirstOrDefaultAsync(c => c.CollectionId == collectionId && c.OwnerId == userId);
        }

        private IQueryable<MusicCollectionDto> ProjectCollections(
            IQueryable<MusicCollectionModel> query, string viewerId, string trackId)
        {
            return from c in query
                   join u in _dbContext.Users on c.OwnerId equals u.Id
                   orderby c.SortOrder, c.CreatedDTime descending
                   select new MusicCollectionDto
                   {
                       CollectionId = c.CollectionId,
                       OwnerId = c.OwnerId,
                       OwnerFullName = u.FullName,
                       OwnerAvatar = u.Avatar,
                       Name = c.Name,
                       Description = c.Description,
                       CoverUrl = (from i in _dbContext.MusicCollectionItem
                                   join t in _dbContext.MusicTrack on i.TrackId equals t.TrackId
                                   where i.CollectionId == c.CollectionId && t.ThumbnailUrl != ""
                                   orderby i.SortOrder
                                   select t.ThumbnailUrl).FirstOrDefault() ?? "",
                       Visibility = c.Visibility,
                       SortOrder = c.SortOrder,
                       ItemCount = _dbContext.MusicCollectionItem.Count(i => i.CollectionId == c.CollectionId),
                       IsOwner = c.OwnerId == viewerId,
                       ContainsTrack = trackId != ""
                           && _dbContext.MusicCollectionItem.Any(i => i.CollectionId == c.CollectionId && i.TrackId == trackId),
                       CreatedDTime = c.CreatedDTime,
                       UpdatedDTime = c.UpdatedDTime,
                   };
        }

        private static string ValidateCollection(MusicCollectionSaveDto data)
        {
            if (data is null || TCommonUtils.IsNullOrEmpty(data.Name?.Trim()))
            {
                return "Vui lòng nhập tên bộ sưu tập";
            }
            if (data.Name.Trim().Length > NameMaxLength)
            {
                return $"Tên bộ sưu tập tối đa {NameMaxLength} ký tự";
            }
            if ((data.Description ?? string.Empty).Length > DescriptionMaxLength)
            {
                return $"Mô tả tối đa {DescriptionMaxLength} ký tự";
            }
            if (!Enum.IsDefined(data.Visibility))
            {
                return "Chế độ hiển thị không hợp lệ";
            }
            return null;
        }

        private static (int PageIndex, int PageSize) NormalizePage(int pageIndex, int pageSize) =>
            (Math.Max(pageIndex, 0), pageSize <= 0 ? 50 : Math.Min(pageSize, MaxPageSize));

        private static ApiResponse<MusicTrackDto> Page(List<MusicTrackDto> tracks, int pageIndex, int pageSize, int itemCount) =>
            new ApiResponse<MusicTrackDto>
            {
                objResult = new PageInfo<MusicTrackDto>
                {
                    PageIndex = pageIndex,
                    PageSize = pageSize,
                    ItemCount = itemCount,
                    PageCount = (int)Math.Ceiling(itemCount / (double)pageSize),
                    DataList = tracks,
                }
            };

        private static MusicTrackDto ToDto(MusicTrackModel track, DateTime? addedDTime) => new MusicTrackDto
        {
            TrackId = track.TrackId,
            Provider = track.Provider,
            ExternalId = track.ExternalId,
            Title = track.Title,
            Artist = track.Artist,
            ThumbnailUrl = track.ThumbnailUrl,
            DurationSeconds = track.DurationSeconds,
            ExternalUrl = track.ExternalUrl,
            Availability = track.Availability,
            AddedDTime = addedDTime,
        };
    }
}
