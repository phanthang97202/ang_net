using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class MstProvinceModel
    {
        [Key]
        [Required]
        public string ProvinceCode { get; set; } = string.Empty; // Mã tỉnh/thành phố
        [Required]
        public string ProvinceName { get; set;} = string.Empty; // Tên tỉnh/thành phố
        public bool FlagActive { get; set; } // Trạng thái
        public DateTime CreatedDTime { get; set; } // Thời gian tạo
        public DateTime UpdatedDTime { get; set; } // Thời gian tạo
    }
}
