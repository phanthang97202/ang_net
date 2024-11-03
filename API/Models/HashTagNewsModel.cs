using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class HashTagNewsModel
    { 
        [Required]
        public string HashTagNewsId { get; set; } = string.Empty; // Mã hashtag
        public string NewsId { get; set; } = string.Empty; // Mã bài viết
        [Required]
        [StringLength(30, ErrorMessage = "HashTagNameIsLimited30Characters")]
        public string HashTagNewsName { get; set; } = string.Empty; // Tên hashtag
        public int Count { get; set; } // Số lần tag
        public bool FlagActive { get; set; } // Trạng thái danh mục
        public DateTime CreatedDTime { get; set; } // Thời gian tạo
        public DateTime UpdatedDTime { get; set; } // Thời gian tạo
    }
}
