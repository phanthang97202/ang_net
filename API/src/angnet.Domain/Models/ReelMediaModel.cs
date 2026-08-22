using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models
{
    public class ReelMediaModel : BaseModel
    {
        [Key]
        [Required]
        public string ReelMediaId { get; set; } = Guid.NewGuid().ToString(); // Mã media

        [Required]
        public string ReelId { get; set; } = string.Empty; // Mã reel

        [Required]
        public string MediaUrl { get; set; } = string.Empty; // Link video hoặc ảnh

        public int SortOrder { get; set; } // Thứ tự trong carousel ảnh; video luôn = 0

        public int? DurationSeconds { get; set; } // Thời lượng video, hoặc thời gian hiển thị của ảnh này
        public int? Width { get; set; } // Kích thước media, dùng để dựng tỉ lệ khung hình
        public int? Height { get; set; }
    }
}
