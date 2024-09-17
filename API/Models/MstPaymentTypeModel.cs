using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class MstPaymentTypeModel
    {
        [Key]
        [Required]
        public string PaymentTypeCode { get; set; } = string.Empty; // Mã loại thanh toán
        [Required]
        public string PaymentTypeName { get; set; } = string.Empty; // Tên loại thanh toán
        public bool FlagActive { get; set; } // Trạng thái
        public DateTime CreatedDTime { get; set; } // Thời gian tạo
        public DateTime UpdatedDTime { get; set; } // Thời gian tạo
    }
}
