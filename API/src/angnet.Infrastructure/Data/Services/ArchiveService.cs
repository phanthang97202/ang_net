using angnet.Domain.Dtos;
using angnet.Domain.Enums;
using angnet.Domain.Models;
using Microsoft.EntityFrameworkCore;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;

namespace angnet.Infrastructure.Data.Services
{
    public interface IArchiveService
    {
        Task<ApiResponse<ArchiveCollectionDto>> GetMyCollectionsAsync(string userId);
        Task<ApiResponse<ArchiveCollectionDto>> GetCollectionAsync(string viewerId, string collectionId);
        Task<ApiResponse<ArchiveItemDto>> GetItemsAsync(string viewerId, string collectionId, int pageIndex, int pageSize);
        Task<ApiResponse<ArchiveCollectionDto>> CreateCollectionAsync(string userId, ArchiveCollectionSaveDto data);
        Task<ApiResponse<ArchiveCollectionDto>> UpdateCollectionAsync(string userId, ArchiveCollectionSaveDto data);
        Task<(ApiResponse<bool> Response, List<ArchiveStoredFileDto> Files)> DeleteCollectionAsync(string userId, string collectionId);
        Task<ApiResponse<bool>> ReorderCollectionAsync(string userId, ArchiveCollectionReorderDto data);
        Task<ApiResponse<ArchiveItemDto>> CreateItemAsync(string userId, ArchiveItemCreateDto data, string cloudName);
        Task<ApiResponse<ArchiveItemDto>> UpdateItemAsync(string userId, ArchiveItemUpdateDto data);
        Task<(ApiResponse<bool> Response, List<ArchiveStoredFileDto> Files)> DeleteItemAsync(string userId, string itemId);
    }

    /*
        Thư viện lưu trữ: mỗi người dùng có các bộ sưu tập riêng.

        Hai lớp quyền, cố ý tách nhau:
          1. Permission "archive.use" (gác ở controller): người này có được DÙNG
             tính năng không - Admin cấp theo vai trò.
          2. OwnerId (kiểm tra ở đây): sửa/xoá chỉ được trên đồ CỦA CHÍNH MÌNH.
             Kể cả Admin cũng không sửa và không XEM được bộ Private của người
             khác - nên service này không bao giờ hỏi tới vai trò.

        Bộ không xem được trả về đúng câu "không tồn tại" như bộ thật sự không có,
        để người ngoài không dò được mã nào là bộ riêng tư có thật.
    */
    public class ArchiveService : IArchiveService
    {
        // Thư mục gốc trên Cloudinary; file của mỗi người nằm trong archive/{userId}/
        public const string StorageRootFolder = "archive";

        private const int NameMaxLength = 150;
        private const int DescriptionMaxLength = 2000;
        private const int TitleMaxLength = 300;
        private const int NoteMaxLength = 10000;
        private const int UrlMaxLength = 2048;
        private const int MaxPageSize = 60;

        private const string CollectionNotFound = "Bộ sưu tập không tồn tại";
        private const string ItemNotFound = "Mục lưu trữ không tồn tại";

        private readonly AppDbContext _dbContext;

        public ArchiveService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public static string StorageFolderFor(string userId) => $"{StorageRootFolder}/{userId}";

        public async Task<ApiResponse<ArchiveCollectionDto>> GetMyCollectionsAsync(string userId)
        {
            List<ArchiveCollectionDto> collections = await ProjectCollections(
                    _dbContext.ArchiveCollection.AsNoTracking().Where(c => c.OwnerId == userId), userId)
                .ToListAsync();

            return new ApiResponse<ArchiveCollectionDto> { DataList = collections };
        }

        public async Task<ApiResponse<ArchiveCollectionDto>> GetCollectionAsync(string viewerId, string collectionId)
        {
            ArchiveCollectionDto collection = await FindViewableCollection(viewerId, collectionId);
            return collection is null
                ? new ApiResponse<ArchiveCollectionDto>(CollectionNotFound)
                : new ApiResponse<ArchiveCollectionDto>(collection);
        }

        public async Task<ApiResponse<ArchiveItemDto>> GetItemsAsync(
            string viewerId, string collectionId, int pageIndex, int pageSize)
        {
            if (await FindViewableCollection(viewerId, collectionId) is null)
            {
                return new ApiResponse<ArchiveItemDto>(CollectionNotFound);
            }

            pageSize = pageSize <= 0 ? 24 : Math.Min(pageSize, MaxPageSize);
            pageIndex = Math.Max(pageIndex, 0);

            IQueryable<ArchiveItemModel> query = _dbContext.ArchiveItem.AsNoTracking()
                .Where(i => i.CollectionId == collectionId);

            int itemCount = await query.CountAsync();
            List<ArchiveItemDto> items = await query
                .OrderByDescending(i => i.CreatedDTime)
                .Skip(pageIndex * pageSize)
                .Take(pageSize)
                .Select(i => new ArchiveItemDto
                {
                    ItemId = i.ItemId,
                    CollectionId = i.CollectionId,
                    Kind = i.Kind,
                    Provider = i.Provider,
                    SourceUrl = i.SourceUrl,
                    Title = i.Title,
                    Note = i.Note,
                    ThumbnailUrl = i.ThumbnailUrl,
                    Width = i.Width,
                    Height = i.Height,
                    DurationSeconds = i.DurationSeconds,
                    Bytes = i.Bytes,
                    TakenAt = i.TakenAt,
                    CreatedDTime = i.CreatedDTime,
                })
                .ToListAsync();

            return new ApiResponse<ArchiveItemDto>
            {
                objResult = new PageInfo<ArchiveItemDto>
                {
                    PageIndex = pageIndex,
                    PageSize = pageSize,
                    ItemCount = itemCount,
                    PageCount = (int)Math.Ceiling(itemCount / (double)pageSize),
                    DataList = items,
                }
            };
        }

        public async Task<ApiResponse<ArchiveCollectionDto>> CreateCollectionAsync(string userId, ArchiveCollectionSaveDto data)
        {
            string error = ValidateCollection(data);
            if (error != null)
            {
                return new ApiResponse<ArchiveCollectionDto>(error);
            }

            // Bộ mới nằm cuối thư viện, giống thêm danh mục
            int? maxSortOrder = await _dbContext.ArchiveCollection
                .Where(c => c.OwnerId == userId)
                .MaxAsync(c => (int?)c.SortOrder);

            DateTime now = TCommonUtils.DTimeNow();
            ArchiveCollectionModel collection = new ArchiveCollectionModel
            {
                OwnerId = userId,
                Name = data.Name.Trim(),
                Description = (data.Description ?? string.Empty).Trim(),
                CoverUrl = (data.CoverUrl ?? string.Empty).Trim(),
                Visibility = data.Visibility,
                SortOrder = (maxSortOrder ?? -1) + 1,
                FlagActive = true,
                CreatedBy = userId,
                UpdatedBy = userId,
                CreatedDTime = now,
                UpdatedDTime = now,
            };

            await _dbContext.ArchiveCollection.AddAsync(collection);
            await _dbContext.SaveChangesAsync();

            return await GetCollectionAsync(userId, collection.CollectionId);
        }

        public async Task<ApiResponse<ArchiveCollectionDto>> UpdateCollectionAsync(string userId, ArchiveCollectionSaveDto data)
        {
            string error = ValidateCollection(data);
            if (error != null)
            {
                return new ApiResponse<ArchiveCollectionDto>(error);
            }

            ArchiveCollectionModel collection = await FindOwnedCollection(userId, data.CollectionId);
            if (collection is null)
            {
                return new ApiResponse<ArchiveCollectionDto>(CollectionNotFound);
            }

            collection.Name = data.Name.Trim();
            collection.Description = (data.Description ?? string.Empty).Trim();
            collection.CoverUrl = (data.CoverUrl ?? string.Empty).Trim();
            collection.Visibility = data.Visibility;
            collection.UpdatedBy = userId;
            collection.UpdatedDTime = TCommonUtils.DTimeNow();
            await _dbContext.SaveChangesAsync();

            return await GetCollectionAsync(userId, collection.CollectionId);
        }

        public async Task<(ApiResponse<bool> Response, List<ArchiveStoredFileDto> Files)> DeleteCollectionAsync(
            string userId, string collectionId)
        {
            ArchiveCollectionModel collection = await FindOwnedCollection(userId, collectionId);
            if (collection is null)
            {
                return (new ApiResponse<bool>(CollectionNotFound), new List<ArchiveStoredFileDto>());
            }

            // Lấy danh sách file trước khi xoá, sau khi xoá DB thì không còn biết
            List<ArchiveStoredFileDto> files = await _dbContext.ArchiveItem.AsNoTracking()
                .Where(i => i.CollectionId == collectionId && i.StoragePublicId != "")
                .Select(i => new ArchiveStoredFileDto { PublicId = i.StoragePublicId, Kind = i.Kind })
                .ToListAsync();

            // Các mục bên trong do khoá ngoại ON DELETE CASCADE tự xoá theo
            _dbContext.ArchiveCollection.Remove(collection);
            await _dbContext.SaveChangesAsync();

            return (new ApiResponse<bool>(true), files);
        }

        public async Task<ApiResponse<bool>> ReorderCollectionAsync(string userId, ArchiveCollectionReorderDto data)
        {
            string direction = (data?.Direction ?? string.Empty).Trim().ToLower();
            if (data is null || (direction != "up" && direction != "down"))
            {
                return new ApiResponse<bool>("Hướng di chuyển không hợp lệ");
            }

            List<ArchiveCollectionModel> collections = await _dbContext.ArchiveCollection
                .Where(c => c.OwnerId == userId)
                .OrderBy(c => c.SortOrder)
                .ThenBy(c => c.CreatedDTime)
                .ToListAsync();

            int currentPosition = collections.FindIndex(c => c.CollectionId == data.CollectionId);
            if (currentPosition < 0)
            {
                return new ApiResponse<bool>(CollectionNotFound);
            }

            int targetPosition = direction == "up" ? currentPosition - 1 : currentPosition + 1;
            if (targetPosition < 0 || targetPosition >= collections.Count)
            {
                return new ApiResponse<bool>("Bộ sưu tập đã ở vị trí đầu/cuối");
            }

            ArchiveCollectionModel current = collections[currentPosition];
            collections.RemoveAt(currentPosition);
            collections.Insert(targetPosition, current);

            // Đánh lại số liền mạch cho cả thư viện: dữ liệu cũ có thể trùng số
            for (int index = 0; index < collections.Count; index++)
            {
                collections[index].SortOrder = index;
            }
            await _dbContext.SaveChangesAsync();

            return new ApiResponse<bool>(true);
        }

        public async Task<ApiResponse<ArchiveItemDto>> CreateItemAsync(string userId, ArchiveItemCreateDto data, string cloudName)
        {
            if (data is null)
            {
                return new ApiResponse<ArchiveItemDto>("Dữ liệu không hợp lệ");
            }

            if (await FindOwnedCollection(userId, data.CollectionId) is null)
            {
                return new ApiResponse<ArchiveItemDto>(CollectionNotFound);
            }

            string error = ValidateItemText(data.Title, data.Note);
            if (error != null)
            {
                return new ApiResponse<ArchiveItemDto>(error);
            }

            string sourceUrl = (data.SourceUrl ?? string.Empty).Trim();
            string thumbnailUrl = (data.ThumbnailUrl ?? string.Empty).Trim();
            string storagePublicId = string.Empty;
            EArchiveProvider provider;

            if (!IsHttpUrl(thumbnailUrl, allowEmpty: true))
            {
                return new ApiResponse<ArchiveItemDto>("Link ảnh đại diện không hợp lệ");
            }

            switch (data.Kind)
            {
                case EArchiveItemKind.Link:
                    if (!IsHttpUrl(sourceUrl, allowEmpty: false))
                    {
                        return new ApiResponse<ArchiveItemDto>("Link không hợp lệ, cần bắt đầu bằng http:// hoặc https://");
                    }
                    provider = DetectProvider(new Uri(sourceUrl));
                    break;

                case EArchiveItemKind.Image:
                case EArchiveItemKind.Video:
                    // public_id phải nằm trong thư mục của CHÍNH người này. Không chặn
                    // thì ai đó đăng ký public_id của ảnh bài viết vào thư viện mình,
                    // rồi xoá mục đó là xoá luôn file của người khác trên Cloudinary.
                    storagePublicId = (data.StoragePublicId ?? string.Empty).Trim();
                    if (!storagePublicId.StartsWith(StorageFolderFor(userId) + "/", StringComparison.Ordinal))
                    {
                        return new ApiResponse<ArchiveItemDto>("File tải lên không hợp lệ");
                    }

                    string resourceType = data.Kind == EArchiveItemKind.Image ? "image" : "video";
                    string expectedPrefix = $"https://res.cloudinary.com/{cloudName}/{resourceType}/upload/";
                    if (TCommonUtils.IsNullOrEmpty(cloudName)
                        || !sourceUrl.StartsWith(expectedPrefix, StringComparison.Ordinal)
                        || !sourceUrl.Contains(storagePublicId, StringComparison.Ordinal))
                    {
                        return new ApiResponse<ArchiveItemDto>("File tải lên không hợp lệ");
                    }

                    provider = EArchiveProvider.Cloudinary;
                    if (data.Kind == EArchiveItemKind.Image && thumbnailUrl == string.Empty)
                    {
                        thumbnailUrl = sourceUrl;
                    }
                    break;

                default:
                    return new ApiResponse<ArchiveItemDto>("Loại mục không hợp lệ");
            }

            DateTime now = TCommonUtils.DTimeNow();
            ArchiveItemModel item = new ArchiveItemModel
            {
                CollectionId = data.CollectionId,
                OwnerId = userId,
                Kind = data.Kind,
                Provider = provider,
                SourceUrl = sourceUrl,
                StoragePublicId = storagePublicId,
                Title = (data.Title ?? string.Empty).Trim(),
                Note = (data.Note ?? string.Empty).Trim(),
                ThumbnailUrl = thumbnailUrl,
                Width = data.Width,
                Height = data.Height,
                DurationSeconds = data.DurationSeconds,
                Bytes = data.Bytes,
                TakenAt = ToUtc(data.TakenAt),
                FlagActive = true,
                CreatedBy = userId,
                UpdatedBy = userId,
                CreatedDTime = now,
                UpdatedDTime = now,
            };

            await _dbContext.ArchiveItem.AddAsync(item);
            await _dbContext.SaveChangesAsync();

            return new ApiResponse<ArchiveItemDto>(ToDto(item));
        }

        public async Task<ApiResponse<ArchiveItemDto>> UpdateItemAsync(string userId, ArchiveItemUpdateDto data)
        {
            if (data is null)
            {
                return new ApiResponse<ArchiveItemDto>("Dữ liệu không hợp lệ");
            }

            ArchiveItemModel item = await _dbContext.ArchiveItem
                .FirstOrDefaultAsync(i => i.ItemId == data.ItemId && i.OwnerId == userId);
            if (item is null)
            {
                return new ApiResponse<ArchiveItemDto>(ItemNotFound);
            }

            string error = ValidateItemText(data.Title, data.Note);
            if (error != null)
            {
                return new ApiResponse<ArchiveItemDto>(error);
            }

            // Chuyển sang bộ khác: bộ đích cũng phải là của chính mình
            if (!TCommonUtils.IsNullOrEmpty(data.CollectionId) && data.CollectionId != item.CollectionId)
            {
                if (await FindOwnedCollection(userId, data.CollectionId) is null)
                {
                    return new ApiResponse<ArchiveItemDto>(CollectionNotFound);
                }
                item.CollectionId = data.CollectionId;
            }

            // Ảnh đại diện của file tải lên lấy từ chính file đó; chỉ link ngoài
            // mới cho đổi (Facebook/Instagram không tự lấy được thumbnail).
            if (item.Kind == EArchiveItemKind.Link)
            {
                string thumbnailUrl = (data.ThumbnailUrl ?? string.Empty).Trim();
                if (!IsHttpUrl(thumbnailUrl, allowEmpty: true))
                {
                    return new ApiResponse<ArchiveItemDto>("Link ảnh đại diện không hợp lệ");
                }
                item.ThumbnailUrl = thumbnailUrl;
            }

            item.Title = (data.Title ?? string.Empty).Trim();
            item.Note = (data.Note ?? string.Empty).Trim();
            item.TakenAt = ToUtc(data.TakenAt);
            item.UpdatedBy = userId;
            item.UpdatedDTime = TCommonUtils.DTimeNow();
            await _dbContext.SaveChangesAsync();

            return new ApiResponse<ArchiveItemDto>(ToDto(item));
        }

        public async Task<(ApiResponse<bool> Response, List<ArchiveStoredFileDto> Files)> DeleteItemAsync(
            string userId, string itemId)
        {
            ArchiveItemModel item = await _dbContext.ArchiveItem
                .FirstOrDefaultAsync(i => i.ItemId == itemId && i.OwnerId == userId);
            if (item is null)
            {
                return (new ApiResponse<bool>(ItemNotFound), new List<ArchiveStoredFileDto>());
            }

            List<ArchiveStoredFileDto> files = new List<ArchiveStoredFileDto>();
            if (!TCommonUtils.IsNullOrEmpty(item.StoragePublicId))
            {
                files.Add(new ArchiveStoredFileDto { PublicId = item.StoragePublicId, Kind = item.Kind });
            }

            _dbContext.ArchiveItem.Remove(item);
            await _dbContext.SaveChangesAsync();

            return (new ApiResponse<bool>(true), files);
        }

        private async Task<ArchiveCollectionDto> FindViewableCollection(string viewerId, string collectionId)
        {
            if (TCommonUtils.IsNullOrEmpty(collectionId))
            {
                return null;
            }

            // Không có nhánh nào cho Admin: bộ Private chỉ chủ sở hữu thấy
            return await ProjectCollections(
                    _dbContext.ArchiveCollection.AsNoTracking().Where(c =>
                        c.CollectionId == collectionId
                        && (c.Visibility != EArchiveVisibility.Private || c.OwnerId == viewerId)),
                    viewerId)
                .FirstOrDefaultAsync();
        }

        private Task<ArchiveCollectionModel> FindOwnedCollection(string userId, string collectionId)
        {
            return _dbContext.ArchiveCollection
                .FirstOrDefaultAsync(c => c.CollectionId == collectionId && c.OwnerId == userId);
        }

        private IQueryable<ArchiveCollectionDto> ProjectCollections(IQueryable<ArchiveCollectionModel> query, string viewerId)
        {
            return from c in query
                   join u in _dbContext.Users on c.OwnerId equals u.Id
                   orderby c.SortOrder, c.CreatedDTime
                   select new ArchiveCollectionDto
                   {
                       CollectionId = c.CollectionId,
                       OwnerId = c.OwnerId,
                       OwnerFullName = u.FullName,
                       OwnerAvatar = u.Avatar,
                       Name = c.Name,
                       Description = c.Description,
                       CustomCoverUrl = c.CoverUrl,
                       CoverUrl = c.CoverUrl != ""
                           ? c.CoverUrl
                           : _dbContext.ArchiveItem
                               .Where(i => i.CollectionId == c.CollectionId && i.ThumbnailUrl != "")
                               .OrderByDescending(i => i.CreatedDTime)
                               .Select(i => i.ThumbnailUrl)
                               .FirstOrDefault() ?? "",
                       Visibility = c.Visibility,
                       SortOrder = c.SortOrder,
                       ItemCount = _dbContext.ArchiveItem.Count(i => i.CollectionId == c.CollectionId),
                       IsOwner = c.OwnerId == viewerId,
                       CreatedDTime = c.CreatedDTime,
                       UpdatedDTime = c.UpdatedDTime,
                   };
        }

        private static string ValidateCollection(ArchiveCollectionSaveDto data)
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
            if (!IsHttpUrl((data.CoverUrl ?? string.Empty).Trim(), allowEmpty: true))
            {
                return "Link ảnh bìa không hợp lệ";
            }
            return null;
        }

        private static string ValidateItemText(string title, string note)
        {
            if ((title ?? string.Empty).Trim().Length > TitleMaxLength)
            {
                return $"Tiêu đề tối đa {TitleMaxLength} ký tự";
            }
            if ((note ?? string.Empty).Length > NoteMaxLength)
            {
                return $"Ghi chú tối đa {NoteMaxLength} ký tự";
            }
            return null;
        }

        private static bool IsHttpUrl(string value, bool allowEmpty)
        {
            if (value == string.Empty)
            {
                return allowEmpty;
            }

            return value.Length <= UrlMaxLength
                && Uri.TryCreate(value, UriKind.Absolute, out Uri uri)
                && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
        }

        // Nguồn do server tự nhận diện theo tên miền, không tin giá trị client gửi lên
        private static EArchiveProvider DetectProvider(Uri uri)
        {
            string host = uri.Host.ToLowerInvariant();

            bool Is(string domain) => host == domain || host.EndsWith("." + domain, StringComparison.Ordinal);

            if (Is("youtube.com") || Is("youtu.be")) return EArchiveProvider.YouTube;
            if (Is("tiktok.com")) return EArchiveProvider.TikTok;
            if (Is("facebook.com") || Is("fb.watch")) return EArchiveProvider.Facebook;
            if (Is("instagram.com")) return EArchiveProvider.Instagram;
            return EArchiveProvider.Web;
        }

        // Cột timestamptz của Npgsql chỉ nhận DateTime kiểu UTC
        private static DateTime? ToUtc(DateTime? value)
        {
            if (!value.HasValue) return null;
            return value.Value.Kind switch
            {
                DateTimeKind.Utc => value.Value,
                DateTimeKind.Local => value.Value.ToUniversalTime(),
                _ => DateTime.SpecifyKind(value.Value, DateTimeKind.Utc),
            };
        }

        private static ArchiveItemDto ToDto(ArchiveItemModel item) => new ArchiveItemDto
        {
            ItemId = item.ItemId,
            CollectionId = item.CollectionId,
            Kind = item.Kind,
            Provider = item.Provider,
            SourceUrl = item.SourceUrl,
            Title = item.Title,
            Note = item.Note,
            ThumbnailUrl = item.ThumbnailUrl,
            Width = item.Width,
            Height = item.Height,
            DurationSeconds = item.DurationSeconds,
            Bytes = item.Bytes,
            TakenAt = item.TakenAt,
            CreatedDTime = item.CreatedDTime,
        };
    }
}
