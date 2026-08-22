using angnet.Domain.Enums;

namespace angnet.Domain.Dtos
{
    public class ReelDto
    {
        public string ReelId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string UserFullName { get; set; } = string.Empty;
        public string UserAvatar { get; set; } = string.Empty;
        public string Caption { get; set; } = string.Empty;
        public EReelMediaType MediaType { get; set; }
        public string CoverUrl { get; set; } = string.Empty;
        public int ViewCount { get; set; }
        public int LikeCount { get; set; }
        public int CommentCount { get; set; }
        public bool IsLikedByMe { get; set; }
        public bool IsOwnedByMe { get; set; }
        public DateTime CreatedDTime { get; set; }

        // Chỉ populate ở Detail. Feed dùng CoverUrl để tránh join media cho từng item.
        public List<ReelMediaDto> Media { get; set; } = new List<ReelMediaDto>();
    }

    public class ReelMediaDto
    {
        public string ReelMediaId { get; set; } = string.Empty;
        public string MediaUrl { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public int? DurationSeconds { get; set; }
        public int? Width { get; set; }
        public int? Height { get; set; }
    }
}
