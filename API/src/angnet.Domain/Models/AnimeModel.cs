using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models
{
    public class AnimeModel : BaseModel
    {
        [Key]
        public string AnimeId { get; set; } = Guid.NewGuid().ToString();

        public int AniListId { get; set; }

        [Required, MaxLength(300)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(300)]
        public string NativeTitle { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string CoverImageUrl { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string BannerImageUrl { get; set; } = string.Empty;

        [MaxLength(40)]
        public string Format { get; set; } = string.Empty;

        [MaxLength(40)]
        public string Status { get; set; } = string.Empty;

        public int? ReleaseYear { get; set; }
        public int? EpisodeCount { get; set; }
    }
}
