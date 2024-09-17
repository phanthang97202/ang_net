using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class MstStadiumTypeModel
    {
        [Key]
        [Required]
        public string StadiumTypeCode { get; set; } = string.Empty; // Mã loại sân
        [Required]
        public string StadiumTypeName { get; set; } = string.Empty; // Tên loại sân
        [Required]
        public decimal StadiumTypePrice {  get; set; } // Giá loại sân 
        public decimal StadiumTypeSale { get; set; } // Giảm giá 
        public int StadiumTypeQuantity { get; set; } // Số lượng sân còn
        public bool FlagActive { get; set; } // Trạng thái loại sân (1/0)
        public DateTime CreatedDTime { get; set; } // Thời gian tạo
        public DateTime UpdatedDTime { get; set; } // Thời gian tạo
    }
}
