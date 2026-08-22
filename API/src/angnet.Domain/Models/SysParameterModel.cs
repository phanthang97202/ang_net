using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models
{
    public class SysParameterModel : BaseModel
    {
        [Key]
        [Required]
        public string ParameterCode { get; set; } = string.Empty; // Mã tham số, dùng để tra cứu trong code

        [Required]
        public string ParameterNameVi { get; set; } = string.Empty; // Tên hiển thị tiếng Việt
        [Required]
        public string ParameterNameEn { get; set; } = string.Empty; // Tên hiển thị tiếng Anh

        [Required]
        public string ParameterValueVi { get; set; } = string.Empty; // Giá trị tiếng Việt
        [Required]
        public string ParameterValueEn { get; set; } = string.Empty; // Giá trị tiếng Anh

        [Required]
        public string DefaultValueVi { get; set; } = string.Empty; // Giá trị mặc định tiếng Việt
        [Required]
        public string DefaultValueEn { get; set; } = string.Empty; // Giá trị mặc định tiếng Anh

        [Required]
        public string DataType { get; set; } = string.Empty; // Kiểu dữ liệu của giá trị => string, int, bool, json...
        [Required]
        public string Category { get; set; } = string.Empty; // Nhóm tham số, dùng để gom nhóm trên màn quản trị

        public string DescriptionVi { get; set; } = string.Empty; // Mô tả tiếng Việt
        public string DescriptionEn { get; set; } = string.Empty; // Mô tả tiếng Anh

        public int SortOrder { get; set; } // Thứ tự hiển thị trong nhóm
    }
}
