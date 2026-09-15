using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models
{
    /// <summary>
    /// Menu điều hướng ngoài trang chủ. Cấu trúc 2 cấp qua ParentId tự tham chiếu:
    /// menu cha có ParentId = null, menu con trỏ về MenuId của cha.
    /// </summary>
    public class SysMenuModel : BaseModel
    {
        [Key]
        [Required]
        public string MenuId { get; set; } = string.Empty; // Mã menu, đặt tay cho dễ đọc (home, tools-shift-report...)

        public string? ParentId { get; set; } // Menu cha; null = menu cấp 1

        [Required]
        public string TitleVi { get; set; } = string.Empty; // Chữ hiển thị tiếng Việt
        [Required]
        public string TitleEn { get; set; } = string.Empty; // Chữ hiển thị tiếng Anh

        // Để rỗng với menu cha chỉ dùng làm nhóm xổ xuống (bấm vào không đi đâu).
        public string Path { get; set; } = string.Empty; // Đường dẫn nội bộ, vd /tools/shift-report

        public string Icon { get; set; } = string.Empty; // Tên icon của ng-zorro, vd home, tool, play-circle

        public int SortOrder { get; set; } // Thứ tự hiển thị trong cùng cấp
    }
}
