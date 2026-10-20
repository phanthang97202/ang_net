using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Dtos;

public class MovieWatchProgressSaveDto
{
    [Range(0, int.MaxValue)] public int ServerId { get; set; }
    [Required, MaxLength(200)] public string EpisodeSlug { get; set; } = "";
}

public class MovieWatchProgressDto
{
    public int ServerId { get; set; }
    public string ServerName { get; set; } = "";
    public string EpisodeSlug { get; set; } = "";
    public string EpisodeName { get; set; } = "";
    public DateTime UpdatedAt { get; set; }
}
