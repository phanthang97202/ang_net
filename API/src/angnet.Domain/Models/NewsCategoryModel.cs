using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models
{
    public class NewsCategoryModel : BaseModel
    {
        [Key]
        [Required]
        public string NewsCategoryId { get; set; } = string.Empty; // Mã danh mục bài viết
        public string TenantId { get; set; } = string.Empty; // Mã tenant (ví dụ: "tenant1", "tenant2")
        public string NewsCategoryParentId { get; set; } = string.Empty; // Mã danh mục cha
        [Required]
        public string NewsCategoryName { get; set; } = string.Empty; // Tên danh mục bài viết
        public int NewsCategoryIndex { get; set; } // Số thứ tự 
        public bool IsGlobal { get; set; } // Có phải là danh mục toàn cầu hay không => Cho các tenant khác sử dụng chung
    }
}
