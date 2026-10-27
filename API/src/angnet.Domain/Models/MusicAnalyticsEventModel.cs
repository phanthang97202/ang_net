using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace angnet.Domain.Models;

[Index(nameof(OccurredAt))]
public class MusicAnalyticsEventModel
{
    [Key, MaxLength(36)] public string EventId { get; set; } = "";
    public DateTime OccurredAt { get; set; }
    [MaxLength(20)] public string Kind { get; set; } = "";
    [MaxLength(10)] public string Provider { get; set; } = "";
    [MaxLength(450)] public string? UserId { get; set; }
    [MaxLength(200)] public string TrackId { get; set; } = "";
    [MaxLength(500)] public string Title { get; set; } = "";
    [MaxLength(200)] public string Keyword { get; set; } = "";
    [MaxLength(36)] public string CollectionId { get; set; } = "";
}
