using System.ComponentModel.DataAnnotations;

namespace SharedModels.Models
{
    public class LikeNewsModel
    {
        [Key]
        public string LikeNewsId { get; set; } = Guid.NewGuid().ToString();
        [Required]
        public string NewsId { get; set; } = string.Empty; // Mã bài viết 
        [Required]
        public string UserId { get; set; } = string.Empty; // Người like bài viết
        public DateTime CreatedDTime { get; set; } // Thời gian tạo
        public DateTime UpdatedDTime { get; set; } // Thời gian tạo
    }
}
