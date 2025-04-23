using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SharedModels.Models
{
    public class OrderStadiumModel
    {
        [Key]
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
        public decimal SalePercent {get; set; } // % Giảm giá
        public decimal DebtMoney {get; set; } // Nếu còn nợ => Tiền nợ (thanh toán thiếu)
        public string Remark { get; set; } = string.Empty; // Ghi chú
        public bool OrderStatus { get; set; } // Pending - Chờ, Approved - Duyệt, Done - Đã thanh toán, InDebt - Nợ, Canceled - Hủy
        public DateTime CreatedDTime {get; set; } // Thời gian tạo
        public DateTime UpdatedDTime { get; set; } // Thời gian cập nhật
    }
}
