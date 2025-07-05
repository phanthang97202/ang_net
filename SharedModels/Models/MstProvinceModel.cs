using System.ComponentModel.DataAnnotations;

namespace SharedModels.Models
{
    public class MstProvinceModel : BaseModel
    {
        [Key]
        [Required]
        [MaxLength(10)]
        public string ProvinceCode { get; set; } = string.Empty; // Mã tỉnh/thành phố
        [Required]
        public string ProvinceName { get; set; } = string.Empty; // Tên tỉnh/thành phố 
    }
}
