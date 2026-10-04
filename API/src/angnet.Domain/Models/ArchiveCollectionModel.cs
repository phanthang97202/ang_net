using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using angnet.Domain.Enums;

namespace angnet.Domain.Models
{
    public class ArchiveCollectionModel : BaseModel
    {
        [Key]
        [Required]
        public string CollectionId { get; set; } = Guid.NewGuid().ToString(); // Mã bộ sưu tập

        [Required]
        public string OwnerId { get; set; } = string.Empty; // Chủ sở hữu - người duy nhất được sửa

        public string Name { get; set; } = string.Empty; // Tên bộ sưu tập
        public string Description { get; set; } = string.Empty; // Mô tả
        public string CoverUrl { get; set; } = string.Empty; // Ảnh bìa tự chọn; rỗng thì lấy thumbnail mục mới nhất

        [Column(TypeName = "varchar(20)")]
        public EArchiveVisibility Visibility { get; set; } = EArchiveVisibility.Private; // Mặc định riêng tư

        public int SortOrder { get; set; } // Thứ tự trong thư viện của chủ sở hữu
    }
}
