using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models
{
    public class MstProvinceModel : BaseModel
    {
        [Key]
        [Required]
        [MaxLength(10)]
        public string ProvinceCode { get; set; } = string.Empty; // Mã tỉnh/thành phố
        [Required]
        public string ProvinceName { get; set; } = string.Empty; // Tên tỉnh/thành phố 
        public string TenantId { get; set; } = string.Empty; // Mã tenant (ví dụ: "tenant1", "tenant2")
    }
}
