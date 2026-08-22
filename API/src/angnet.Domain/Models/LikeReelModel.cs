using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models
{
    public class LikeReelModel : BaseModel
    {
        [Key]
        public string LikeReelId { get; set; } = Guid.NewGuid().ToString();
        [Required]
        public string ReelId { get; set; } = string.Empty; // Mã reel
        [Required]
        public string UserId { get; set; } = string.Empty; // Người like reel
    }
}
