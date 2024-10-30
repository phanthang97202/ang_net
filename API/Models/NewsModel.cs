using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Models
{
    public class NewsModel
    {
        [Key]
        [Required]
        public string NewsId { get; set; } = Guid.NewGuid().ToString(); // Mã bài viết
        [ForeignKey("UserId")]
        public string UserId { get; set; } = string.Empty; // Mã người tạo
        [ForeignKey("CategoryNewsId")]
        public string CategoryNewsId { get; set; } = string.Empty; // Mã danh mục
        public string Slug { get; set; } = string.Empty; // Slug bài viết
        public string Thumbnail { get; set; } = string.Empty; // Ảnh thu nhỏ bài viết
        public string ShortTitle { get; set; } = string.Empty; // Tiêu đề ngắn bài viết
        public string ShortDescription { get; set; } = string.Empty; // Mô tả ngắn bài viết
        public string ContentBody { get; set; } = string.Empty; // Nội dung bài viết
        public DateTime CreatedDTime { get; set; } // Thời gian đăng bài
        public DateTime UpdatedDTime { get; set; } // Thời gian sửa bài
        public bool FlagActive { get; set; } // Trạng thái bài viết
        public int ViewCount { get; set; } // Số lượt xem
        public int ShareCount { get; set; } // Số lượt chia sẻ
        public int LikeCount { get; set; } // Số lượt thích
        public double AvgPoint { get; set; } // Trung bình lượt đánh giá * (thang điểm 10)
        /* 
            Tách ra làm quan hệ 1 - nhiều 
        */
        public string HashTag { get; set; } = string.Empty; // Từ khóa bài viết
        public string RefFile { get; set; } = string.Empty; // File đính kèm 
    }
}
