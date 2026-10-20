using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models;

public class MovieWatchProgressModel
{
    [Required] public string UserId { get; set; } = "";
    [Required, MaxLength(40)] public string Provider { get; set; } = "phimapi";
    [Required, MaxLength(200)] public string MovieSlug { get; set; } = "";
    public int ServerId { get; set; }
    [Required, MaxLength(200)] public string ServerName { get; set; } = "";
    [Required, MaxLength(200)] public string EpisodeSlug { get; set; } = "";
    [Required, MaxLength(200)] public string EpisodeName { get; set; } = "";
    public DateTime UpdatedAt { get; set; }
}
