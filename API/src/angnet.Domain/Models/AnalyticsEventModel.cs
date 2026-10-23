using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace angnet.Domain.Models;

[Index(nameof(OccurredAt), nameof(Kind))]
[Index(nameof(Kind), nameof(ContentId), nameof(OccurredAt))]
public class AnalyticsEventModel
{
    [Key, MaxLength(64)] public string EventId { get; set; } = "";
    public DateTime OccurredAt { get; set; }
    [MaxLength(13)] public string LocalHour { get; set; } = "";
    [MaxLength(36)] public string SessionId { get; set; } = "";
    [MaxLength(12)] public string Kind { get; set; } = "";
    [MaxLength(200)] public string ContentId { get; set; } = "";
    [MaxLength(500)] public string Title { get; set; } = "";
    [MaxLength(500)] public string Path { get; set; } = "";
}

[Index(nameof(LastSeenAt))]
public class AnalyticsPresenceModel
{
    [Key, MaxLength(36)] public string SessionId { get; set; } = "";
    public DateTime LastSeenAt { get; set; }
}

public class AnalyticsCollectionModel
{
    [Key] public int Id { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? UnifiedAt { get; set; }
    public DateTime? LegacyCapturedAt { get; set; }
    public DateTime? MovieImportedAt { get; set; }
    public DateTime? MovieHistoryStartedAt { get; set; }
}
