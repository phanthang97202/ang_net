using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models;

// Append-only events: removing a like or changing a rating must not erase history.
public class BlogActivityModel
{
    [Key] public string ActivityId { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string NewsId { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
    public string? CommentId { get; set; }
    public double? Point { get; set; }
    public DateTime OccurredAt { get; set; }
}
