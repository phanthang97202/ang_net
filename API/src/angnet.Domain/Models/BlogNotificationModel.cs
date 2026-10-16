using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models;

public class BlogNotificationModel
{
    [Key] public string NotificationId { get; set; } = Guid.NewGuid().ToString();
    public string RecipientId { get; set; } = string.Empty;
    public string ActorId { get; set; } = string.Empty;
    public string NewsId { get; set; } = string.Empty;
    public string CommentId { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
}
