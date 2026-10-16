namespace angnet.Domain.Dtos;

public class BlogNotificationDto
{
    public string NotificationId { get; set; } = string.Empty;
    public string ActorName { get; set; } = string.Empty;
    public string? ActorAvatar { get; set; }
    public string NewsId { get; set; } = string.Empty;
    public string CategoryNewsId { get; set; } = string.Empty;
    public string CommentId { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? TitleEn { get; set; }
    public string Excerpt { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
}

public class BlogNotificationPageDto : CursorPageInfo<BlogNotificationDto>
{
    public DateTime SnapshotAt { get; set; }
    public int UnreadCount { get; set; }
}
