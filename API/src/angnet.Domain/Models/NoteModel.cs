using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models
{
    /// <summary>
    /// Ghi chú công khai. Người gửi ẩn danh chỉ được tạo; nội dung đã tạo không
    /// có luồng cập nhật. FlagActive dành riêng cho quản trị viên kiểm duyệt.
    /// </summary>
    public class NoteModel : BaseModel
    {
        [Key]
        public string NoteId { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [MaxLength(100)]
        public string Alias { get; set; } = string.Empty;

        [Required]
        public string ContentBody { get; set; } = string.Empty;
    }
}
