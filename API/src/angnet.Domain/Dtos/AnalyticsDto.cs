using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Dtos;

public class AnalyticsTrackDto
{
    [Required, MaxLength(36)] public string SessionId { get; set; } = "";
    [Required, MaxLength(36)] public string NavigationId { get; set; } = "";
    [Required, MaxLength(500)] public string Path { get; set; } = "";
    public bool PageView { get; set; }
    [MaxLength(36)] public string? VisitorId { get; set; }
    public bool Active { get; set; }
}

public class AnalyticsCountsDto
{
    public int Sessions { get; set; }
    public int Pages { get; set; }
    public int Articles { get; set; }
    public int Movies { get; set; }
    public int Reels { get; set; }
}

public class AnalyticsPointDto : AnalyticsCountsDto
{
    public string Bucket { get; set; } = "";
}

public class AnalyticsTopDto
{
    public string ContentId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Path { get; set; } = "";
    public int Views { get; set; }
    public int Sessions { get; set; }
    public int UnknownSessions { get; set; }
}

public class AnalyticsReportDto
{
    public string From { get; set; } = "";
    public string To { get; set; } = "";
    public string PreviousFrom { get; set; } = "";
    public string PreviousTo { get; set; } = "";
    public string TimeZone { get; set; } = "Asia/Ho_Chi_Minh";
    public DateTime? CollectionStartedAt { get; set; }
    public DateTime GeneratedAt { get; set; }
    public int Online { get; set; }
    public bool PreviousPeriodComplete { get; set; }
    public AnalyticsCountsDto Current { get; set; } = new();
    public AnalyticsCountsDto Previous { get; set; } = new();
    public List<AnalyticsPointDto> Points { get; set; } = [];
    public List<AnalyticsPointDto> PreviousPoints { get; set; } = [];
    public List<AnalyticsTopDto> TopArticles { get; set; } = [];
    public List<AnalyticsTopDto> TopMovies { get; set; } = [];
    public AnalyticsLifetimeDto Lifetime { get; set; } = new();
    public Dictionary<string, DateTime?> Coverage { get; set; } = new();
    public long WriteFailures { get; set; }
    public DateTime? LastWriteFailureAt { get; set; }
}

public class AnalyticsLifetimeDto
{
    public long TotalVisits { get; set; }
    public long MonthVisits { get; set; }
    public long ArticleViews { get; set; }
    public long ReelViews { get; set; }
    public long MovieOpens { get; set; }
    public bool LegacyWebsiteImported { get; set; }
    public bool LegacyWebsiteMerged { get; set; }
    public DateTime? LegacyCapturedAt { get; set; }
    public List<AnalyticsLegacyValueDto> LegacyWebsite { get; set; } = [];
}

public class AnalyticsLegacyValueDto
{
    public string Period { get; set; } = "";
    public long Value { get; set; }
}

public class AnalyticsReconciliationDto
{
    public DateTime GeneratedAt { get; set; }
    public DateTime? AnalyticsStartedAt { get; set; }
    public DateTime? UnifiedAt { get; set; }
    public DateTime? LegacyCapturedAt { get; set; }
    public DateTime? MovieImportedAt { get; set; }
    public long ExistingMovieRows { get; set; }
    public long AuditBeforeAnalytics { get; set; }
    public long AuditOverlappingAnalytics { get; set; }
    public long UnrecognisedAuditRows { get; set; }
    public long ArticleCounterSnapshot { get; set; }
    public long ReelCounterSnapshot { get; set; }
    public bool RedisAvailable { get; set; }
    public bool RedisSnapshotExists { get; set; }
    public string RedisError { get; set; } = "";
    public List<AnalyticsLegacyValueDto> WebsiteValues { get; set; } = [];
    public string PlanToken { get; set; } = "";
}

public class AnalyticsImportDto
{
    [Required, MaxLength(64)] public string PlanToken { get; set; } = "";
}

public class MovieViewWriteDto
{
    public string MovieSlug { get; set; } = "";
    public string MovieTitle { get; set; } = "";
    public int ServerId { get; set; }
    public string ServerName { get; set; } = "";
    public string EpisodeSlug { get; set; } = "";
    public string EpisodeName { get; set; } = "";
}

public class MovieViewLogDto
{
    public string MovieSlug { get; set; } = "";
    public string MovieTitle { get; set; } = "";
    public int? ServerId { get; set; }
    public string? ServerName { get; set; }
    public string? EpisodeSlug { get; set; }
    public string? EpisodeName { get; set; }
    public string EventId { get; set; } = "";
    public DateTime OccurredAt { get; set; }
    public string? UserId { get; set; }
    public string ActorName { get; set; } = "";
    public string Source { get; set; } = "";
}

public class MovieViewLogPageDto
{
    public List<MovieViewLogDto> Items { get; set; } = [];
    public string? NextCursor { get; set; }
}
