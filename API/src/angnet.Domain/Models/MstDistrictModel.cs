using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace angnet.Domain.Models
{
    public class MstDistrictModel : BaseModel
    {
        [Key]
        [Required]
        public string DistrictCode { get; set; } = string.Empty; // Mã quận/huyện
        [Required]
        [ForeignKey("ProvinceCode")]
        public string ProvinceCode { get; set; } = string.Empty; // Mã tỉnh/thành phố
        [Required]
        public string DistrictName { get; set; } = string.Empty; // Tên quận/huyện 
    }
}

