
namespace angnet.Domain.Dtos
{
    public class ReelCommentDto
    {
        public string CommentId { get; set; } = string.Empty;
        public string ReelId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string UserFullName { get; set; } = string.Empty;
        public string UserAvatar { get; set; } = string.Empty;
        public string ParentCommentId { get; set; } = default!;
        public string Content { get; set; } = string.Empty;
        public int ReplyCount { get; set; }
        public bool IsOwnedByMe { get; set; }
        public DateTime CreatedDTime { get; set; }

        // Vài reply đầu tiên, chỉ populate cho comment gốc. Xem thêm qua endpoint Replies.
        public List<ReelCommentDto> Replies { get; set; } = new List<ReelCommentDto>();
    }

    public class ReelCommentCreateDto
    {
        public string ReelId { get; set; } = string.Empty;
        public string ParentCommentId { get; set; } = default!;
        public string Content { get; set; } = string.Empty;
    }
}
