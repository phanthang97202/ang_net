using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace angnet.Domain.Models;

// The only durable measurement ledger. Balances are captured totals, not dated views.
[Index(nameof(Kind), nameof(OccurredAt))]
[Index(nameof(Kind), nameof(ContentId))]
public class AnalyticsLedgerModel
{
    [Key, MaxLength(64)] public string EventId { get; set; } = "";
    [MaxLength(12)] public string Kind { get; set; } = "";
    [MaxLength(12)] public string RecordType { get; set; } = "event";
    public long Quantity { get; set; } = 1;
    public long? OriginalValue { get; set; }
    public bool Included { get; set; } = true;
    public DateTime OccurredAt { get; set; }
    [MaxLength(13)] public string LocalHour { get; set; } = "";
    [MaxLength(7)] public string Period { get; set; } = "";
    [MaxLength(36)] public string? SessionId { get; set; }
    [MaxLength(200)] public string ContentId { get; set; } = "";
    [MaxLength(500)] public string Title { get; set; } = "";
    [MaxLength(500)] public string Path { get; set; } = "";
    [MaxLength(32)] public string Source { get; set; } = "web";
    [MaxLength(250)] public string SourceId { get; set; } = "";
    [MaxLength(300)] public string Note { get; set; } = "";
    [MaxLength(450)] public string? UserId { get; set; }
    [MaxLength(256)] public string ActorName { get; set; } = "";
    public int? ServerId { get; set; }
    [MaxLength(200)] public string? ServerName { get; set; }
    [MaxLength(200)] public string? EpisodeSlug { get; set; }
    [MaxLength(200)] public string? EpisodeName { get; set; }
    public int? LegacyAuditTrailId { get; set; }
}

public class AnalyticsGapModel
{
    [Key, MaxLength(36)] public string GapId { get; set; } = "";
    public DateTime StartedAt { get; set; }
    public DateTime EndedAt { get; set; }
    public long Failures { get; set; }
}
