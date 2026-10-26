using angnet.Domain.Enums;

namespace angnet.Domain.Dtos
{
    public class MusicTrackDto
    {
        public string TrackId { get; set; } = string.Empty;
        public EMusicProvider Provider { get; set; }
        public string ExternalId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty;
        public int? DurationSeconds { get; set; }
        public string ExternalUrl { get; set; } = string.Empty;
        public EMusicTrackAvailability Availability { get; set; }
        // Thời điểm lưu (danh sách Đã lưu) hoặc thêm vào bộ (danh sách trong bộ)
        public DateTime? AddedDTime { get; set; }
    }

    /// <summary>
    /// Khoá nhận diện bài ở nguồn. Client chỉ gửi cặp này; tên, ca sĩ, ảnh do
    /// server tự lấy từ nguồn vì bảng MusicTrack dùng chung cho mọi người.
    /// </summary>
    public class MusicTrackKeyDto
    {
        public EMusicProvider Provider { get; set; }
        public string ExternalId { get; set; } = string.Empty;
        public string TrackId { get; set; } = string.Empty; // Chỉ có ở kết quả trả về
    }

    public class MusicSaveStateRequestDto
    {
        public List<MusicTrackKeyDto> Tracks { get; set; } = new List<MusicTrackKeyDto>();
    }

    public class MusicCollectionDto
    {
        public string CollectionId { get; set; } = string.Empty;
        public string OwnerId { get; set; } = string.Empty;
        public string OwnerFullName { get; set; } = string.Empty;
        public string OwnerAvatar { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string CoverUrl { get; set; } = string.Empty; // Ảnh của bài đứng đầu bộ
        public EArchiveVisibility Visibility { get; set; }
        public int SortOrder { get; set; }
        public int ItemCount { get; set; }
        public bool IsOwner { get; set; }
        // Chỉ có nghĩa khi hỏi kèm trackId: bài đó đã nằm trong bộ này chưa (modal chọn bộ)
        public bool ContainsTrack { get; set; }
        public DateTime CreatedDTime { get; set; }
        public DateTime UpdatedDTime { get; set; }
    }

    public class MusicCollectionSaveDto
    {
        public string CollectionId { get; set; } = string.Empty; // Rỗng khi tạo mới
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public EArchiveVisibility Visibility { get; set; } = EArchiveVisibility.Private;
    }

    public class MusicCollectionItemAddDto
    {
        public string CollectionId { get; set; } = string.Empty;
        public EMusicProvider Provider { get; set; }
        public string ExternalId { get; set; } = string.Empty;
    }

    /// <summary>Dời một bài lên/xuống một bậc trong bộ, giống ArchiveCollectionReorderDto.</summary>
    public class MusicCollectionItemMoveDto
    {
        public string CollectionId { get; set; } = string.Empty;
        public string TrackId { get; set; } = string.Empty;

        /// <summary>"up" hoặc "down".</summary>
        public string Direction { get; set; } = string.Empty;
    }
}
