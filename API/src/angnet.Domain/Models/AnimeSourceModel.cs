using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models
{
    public class AnimeSourceModel : BaseModel
    {
        [Key]
        public string SourceId { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string EpisodeId { get; set; } = string.Empty;

        [Required, MaxLength(30)]
        public string Provider { get; set; } = string.Empty;

        [Required, MaxLength(2000)]
        public string SourceValue { get; set; } = string.Empty;

        [MaxLength(30)]
        public string Quality { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Language { get; set; } = string.Empty;

        public int Priority { get; set; }
    }
}
