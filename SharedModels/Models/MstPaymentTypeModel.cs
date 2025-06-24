using System.ComponentModel.DataAnnotations;

namespace SharedModels.Models
{
    public class MstPaymentTypeModel : BaseModel
    {
        [Key]
        [Required]
        public string PaymentTypeCode { get; set; } = string.Empty; // Mã loại thanh toán
        [Required]
        public string PaymentTypeName { get; set; } = string.Empty; // Tên loại thanh toán 
    }
}
