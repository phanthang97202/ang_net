using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using angnet.Domain.Enums;

namespace angnet.Domain.Models
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

        public bool IsPinned { get; set; } // Ghim lên đầu danh sách
        // Thứ tự giữa các bài cùng ghim, số nhỏ hiện trước. Chỉ có nghĩa khi IsPinned = true.
        public int PinOrder { get; set; }

        // Thời điểm đã gửi mail báo bài này cho người đăng ký. null = chưa gửi.
        //
        // Cột này là thứ chặn gửi trùng: Update cho phép sửa bài nhiều lần sau khi
        // đăng, nếu chỉ dựa vào "bài đã xuất bản" thì mỗi lần sửa lỗi chính tả rồi
        // lưu lại là người đọc nhận thêm một mail nữa.
        public DateTime? NotifiedAt { get; set; }
        [Column(TypeName = "varchar(20)")]
        public EWhoCanSee WhoCanSee { get; set; } // Loại chính sách (ví dụ: Chỉ tenant, Chỉ mình tôi, Public, v.v.) 
    }
}
