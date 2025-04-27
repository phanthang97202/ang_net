using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SharedModels.Models
{
    public class MstDistrictModel
    {
        [Key]
        [Required]
        public string DistrictCode { get; set; } = string.Empty; // Mã quận/huyện
        [Required]
        [ForeignKey("ProvinceCode")]
        public string ProvinceCode { get; set; } = string.Empty; // Mã tỉnh/thành phố
        [Required]
        public string DistrictName { get; set; } = string.Empty; // Tên quận/huyện
        public bool FlagActive { get; set; } // Trạng thái
        public DateTime CreatedDTime { get; set; } // Thời gian tạo
        public DateTime UpdatedDTime { get; set; } // Thời gian tạo
    }
}

