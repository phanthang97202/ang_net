using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Dtos;

public class AnalyticsTrackDto
{
    [Required, MaxLength(36)] public string SessionId { get; set; } = "";
    [Required, MaxLength(36)] public string NavigationId { get; set; } = "";
    [Required, MaxLength(500)] public string Path { get; set; } = "";
    public bool PageView { get; set; }
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
}
