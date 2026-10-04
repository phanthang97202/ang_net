using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using angnet.Domain.Enums;

namespace angnet.Domain.Models
{
    public class ArchiveItemModel : BaseModel
    {
        [Key]
        [Required]
        public string ItemId { get; set; } = Guid.NewGuid().ToString(); // Mã mục

        [Required]
        public string CollectionId { get; set; } = string.Empty; // Bộ sưu tập chứa mục này (1 mục thuộc đúng 1 bộ)

        [Required]
        public string OwnerId { get; set; } = string.Empty; // Lặp lại chủ bộ sưu tập để kiểm tra quyền không cần join

        [Column(TypeName = "varchar(20)")]
        public EArchiveItemKind Kind { get; set; } // Image | Video | Link - quyết định cách hiển thị

        [Column(TypeName = "varchar(30)")]
        public EArchiveProvider Provider { get; set; } // Nơi nội dung nằm, server tự nhận diện

        public string SourceUrl { get; set; } = string.Empty; // Link gốc người dùng dán, hoặc URL file Cloudinary
        public string StoragePublicId { get; set; } = string.Empty; // public_id Cloudinary để xoá file; rỗng với link ngoài

        public string Title { get; set; } = string.Empty; // Tiêu đề
        public string Note { get; set; } = string.Empty; // Ghi chú / kiến thức rút ra
        public string ThumbnailUrl { get; set; } = string.Empty; // Ảnh đại diện hiển thị trong lưới

        public int? Width { get; set; } // Kích thước, dùng dựng tỉ lệ khung hình
        public int? Height { get; set; }
        public int? DurationSeconds { get; set; } // Thời lượng video
        public long? Bytes { get; set; } // Dung lượng file tải lên, để sau này tính hạn mức theo người dùng

        public DateTime? TakenAt { get; set; } // Ngày diễn ra kỷ niệm, khác ngày tải lên
    }
}
