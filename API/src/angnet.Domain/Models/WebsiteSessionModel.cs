using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace angnet.Domain.Models;

[Index(nameof(StartedAt))]
[Index(nameof(LastSeenAt))]
public class WebsiteSessionModel
{
    [Key, MaxLength(36)] public string SessionId { get; set; } = "";
    [MaxLength(80)] public string VisitorId { get; set; } = "";
    public DateTime StartedAt { get; set; }
    [MaxLength(13)] public string StartedLocalHour { get; set; } = "";
    public DateTime LastSeenAt { get; set; }
    public DateTime LastActivityAt { get; set; }
    public bool IsCurrent { get; set; }
    [MaxLength(16)] public string Source { get; set; } = "web";
}

[Index(nameof(OccurredAt))]
[Index(nameof(MovieSlug), nameof(OccurredAt))]
[Index(nameof(UserId), nameof(OccurredAt))]
public class MovieViewLogModel
{
    [Key, MaxLength(64)] public string EventId { get; set; } = "";
    public DateTime OccurredAt { get; set; }
    [MaxLength(13)] public string LocalHour { get; set; } = "";
    [MaxLength(36)] public string? SessionId { get; set; }
    [MaxLength(450)] public string? UserId { get; set; }
    [MaxLength(256)] public string ActorName { get; set; } = "";
    [MaxLength(200)] public string MovieSlug { get; set; } = "";
    [MaxLength(500)] public string MovieTitle { get; set; } = "";
    public int? ServerId { get; set; }
    [MaxLength(200)] public string? ServerName { get; set; }
    [MaxLength(200)] public string? EpisodeSlug { get; set; }
    [MaxLength(200)] public string? EpisodeName { get; set; }
    [MaxLength(24)] public string Source { get; set; } = "playback";
    public int? LegacyAuditTrailId { get; set; }
}

public class AnalyticsLegacySnapshotModel
{
    [Key, MaxLength(250)] public string SnapshotId { get; set; } = "";
    [MaxLength(20)] public string Kind { get; set; } = "";
    public string ContentId { get; set; } = "";
    [MaxLength(500)] public string Title { get; set; } = "";
    [MaxLength(32)] public string Source { get; set; } = "";
    [MaxLength(7)] public string Period { get; set; } = "";
    public long Value { get; set; }
    public DateTime CapturedAt { get; set; }
    public bool CanMerge { get; set; }
}
