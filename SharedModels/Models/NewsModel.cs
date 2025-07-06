using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SharedModels.Enums;

namespace SharedModels.Models
{
    public class NewsModel : BaseModel
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
        public int ViewCount { get; set; } // Số lượt xem
        public int ShareCount { get; set; } // Số lượt chia sẻ
        public int LikeCount { get; set; } // Số lượt thích
        public double AvgPoint { get; set; } // Trung bình lượt đánh giá * (thang điểm 10)
        [Column(TypeName = "varchar(20)")]
        public EWhoCanSee WhoCanSee { get; set; } // Loại chính sách (ví dụ: Chỉ tenant, Chỉ mình tôi, Public, v.v.) 
    }
}
