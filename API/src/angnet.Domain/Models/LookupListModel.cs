using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models;

/// <summary>
/// Một mục trong danh sách chọn (dropdown) của người dùng. Mọi danh sách dùng chung
/// bảng này, phân biệt bằng ListCode; mỗi người dùng có bộ mục riêng (OwnerId).
/// Dữ liệu nghiệp vụ (sự kiện, giao dịch) lưu Code - đổi tên mục không làm hỏng dữ liệu cũ.
/// </summary>
public class LookupListModel
{
    [Key, MaxLength(36)] public string Id { get; set; } = "";
    [Required] public string OwnerId { get; set; } = "";
    [Required, MaxLength(40)] public string ListCode { get; set; } = "";
    // 16 ký tự: vừa cột Category/Status của lịch và CategoryCode của thu chi
    [Required, MaxLength(16)] public string Code { get; set; } = "";
    [MaxLength(80)] public string NameVi { get; set; } = "";
    [MaxLength(80)] public string NameEn { get; set; } = "";
    [MaxLength(7)] public string Color { get; set; } = "";
    // Chỉ danh mục thu chi: income | expense | both. Danh sách khác để rỗng.
    [MaxLength(8)] public string Kind { get; set; } = "";
    public int SortOrder { get; set; }
    public bool FlagActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
