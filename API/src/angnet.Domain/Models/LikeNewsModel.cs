using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models
{
    public class LikeNewsModel : BaseModel
    {
        [Key]
        public string LikeNewsId { get; set; } = Guid.NewGuid().ToString();
        [Required]
        public string NewsId { get; set; } = string.Empty; // Mã bài viết 
        [Required]
        public string UserId { get; set; } = string.Empty; // Người like bài viết 
    }
}
