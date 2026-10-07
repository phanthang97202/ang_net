using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models
{
    public class AnimeEpisodeModel : BaseModel
    {
        [Key]
        public string EpisodeId { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string AnimeId { get; set; } = string.Empty;

        public int EpisodeNumber { get; set; }

        [MaxLength(300)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string ThumbnailUrl { get; set; } = string.Empty;

        public int? DurationSeconds { get; set; }
        public int SortOrder { get; set; }
    }
}
