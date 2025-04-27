using System.ComponentModel.DataAnnotations;

namespace SharedModels.Models
{
    public class MstStadiumTypeModel
    {
        [Key]
        [Required]
        public string StadiumTypeCode { get; set; } = string.Empty; // Mã loại sân
        [Required]
        public string StadiumTypeName { get; set; } = string.Empty; // Tên loại sân
        [Required]
        public decimal StadiumTypeSalePercent { get; set; } // Giảm giá 
        public string Remark { get; set; } = string.Empty; // Ghi chú
        public bool FlagActive { get; set; } // Trạng thái loại sân (1/0)
        public DateTime CreatedDTime { get; set; } // Thời gian tạo
        public DateTime UpdatedDTime { get; set; } // Thời gian tạo
    }
}
