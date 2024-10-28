using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class RefFileNewsModel
    {
        [Key]
        [Required]
        public string RefFileNewsId { get; set; } = string.Empty; // Mã file đính kèm 
        public string NewsId { get; set; } = string.Empty; // Mã bài viết
        public string FileUrl { get; set; } = string.Empty; // Link file
        public bool FlagActive { get; set; } // Trạng thái danh mục
        public DateTime CreatedDTime { get; set; } // Thời gian tạo
        public DateTime UpdatedDTime { get; set; } // Thời gian tạo
    }
}
