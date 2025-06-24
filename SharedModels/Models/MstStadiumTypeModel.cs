using System.ComponentModel.DataAnnotations;

namespace SharedModels.Models
{
    public class MstStadiumTypeModel : BaseModel
    {
        [Key]
        [Required]
        public string StadiumTypeCode { get; set; } = string.Empty; // Mã loại sân
        [Required]
        public string StadiumTypeName { get; set; } = string.Empty; // Tên loại sân
        [Required]
        public decimal StadiumTypeSalePercent { get; set; } // Giảm giá 
        public string Remark { get; set; } = string.Empty; // Ghi chú 
    }
}
