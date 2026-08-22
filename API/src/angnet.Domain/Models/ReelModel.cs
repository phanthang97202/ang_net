using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using angnet.Domain.Enums;

namespace angnet.Domain.Models
{
    public class ReelModel : BaseModel
    {
        [Key]
        [Required]
        public string ReelId { get; set; } = Guid.NewGuid().ToString(); // Mã reel

        [ForeignKey("UserId")]
        public string UserId { get; set; } = string.Empty; // Mã người đăng

        public string Caption { get; set; } = string.Empty; // Nội dung mô tả

        [Column(TypeName = "varchar(20)")]
        public EReelMediaType MediaType { get; set; } = EReelMediaType.Video; // Video hoặc Image (carousel ảnh), quyết định cách render ở FE

        public string CoverUrl { get; set; } = string.Empty; // Thumbnail hiển thị ngoài feed, không cần join sang ReelMedia

        public int ViewCount { get; set; } // Số lượt xem
        public int LikeCount { get; set; } // Số lượt thích
        public int CommentCount { get; set; } // Số lượt bình luận
    }
}
