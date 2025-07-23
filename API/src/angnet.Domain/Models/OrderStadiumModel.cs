using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using angnet.Domain.Enums;

namespace angnet.Domain.Models
{
    public class OrderStadiumModel : BaseModel
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int OrderStadiumId { get; set; }
        [Required]
        public string OrderStadiumCode { get; set; } = string.Empty; // Mã hóa đơn
        [ForeignKey("StadiumCode")]
        [Required]
        public string StadiumCode {get; set; } = string.Empty; // Mã sân bóng
        [ForeignKey("UserId")]
        [Required]
        public string UserId { get; set; } = string.Empty; // Mã người dùng
        [Required]
        public DateTime OderDTime {get; set; } // Ngày đặt sân
        [Required]
        public DateTime RentDTimeFrom {get; set; } // Đặt từ
        [Required]
        public DateTime RentDTimeTo {get; set; } // Đặt đến
        [ForeignKey("PaymentTypeCode")]
        [Required]
        public string PaymentTypeCode {get; set; } = string.Empty; // Hình thức thanh toán
        [Required]
        public decimal PreMoney {get; set; } // Tiền thanh toán trước
        public decimal RefundMoney { get; set; } // Tiền hoàn lại (nếu có) // Áp dụng cho các trường hợp hủy đơn hoặc hoàn tiền nhưng đã cọc tiền
        public decimal SalePercent {get; set; } // % Giảm giá
        public decimal DebtMoney {get; set; } // Nếu còn nợ => Tiền nợ (thanh toán thiếu)
        public string Remark { get; set; } = string.Empty; // Ghi chú
        [Column(TypeName = "varchar(20)")]
        public EOrderStatus OrderStatus { get; set; } // Trạng thái order
        public string VoucherCode { get; set; } = string.Empty; // Mã phần thưởng nếu có 
    } 
}
