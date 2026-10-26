using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using angnet.Domain.Enums;

namespace angnet.Domain.Models
{
    public class MusicCollectionModel : BaseModel
    {
        [Key]
        [Required]
        public string CollectionId { get; set; } = Guid.NewGuid().ToString(); // Mã bộ sưu tập

        [Required]
        public string OwnerId { get; set; } = string.Empty; // Chủ sở hữu - người duy nhất được sửa

        public string Name { get; set; } = string.Empty; // Tên bộ sưu tập
        public string Description { get; set; } = string.Empty; // Mô tả

        // Dùng chung enum với Thư viện lưu trữ: cùng một nghĩa Private/Unlisted/Public
        [Column(TypeName = "varchar(20)")]
        public EArchiveVisibility Visibility { get; set; } = EArchiveVisibility.Private;

        public int SortOrder { get; set; } // Thứ tự trong thư viện của chủ sở hữu
    }

    /// <summary>
    /// Bài trong một bộ sưu tập. Một bài có thể nằm ở nhiều bộ (khác Archive).
    /// </summary>
    public class MusicCollectionItemModel
    {
        public string CollectionId { get; set; } = string.Empty;
        public string TrackId { get; set; } = string.Empty;
        public string OwnerId { get; set; } = string.Empty; // Lặp lại chủ bộ sưu tập để kiểm tra quyền không cần join
        public int SortOrder { get; set; } // Bài mới thêm nằm đầu bộ; số cách nhau 1000 nên đổi chỗ không phải đánh lại cả bộ
        public DateTime AddedDTime { get; set; }
    }
}
