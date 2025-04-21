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
        public decimal PrePrice {get; set; } // Tiền cọc 
        public decimal Sale {get; set; } // Giảm giá
        public bool FlagFinish {get; set; } // Hoàn thành chưa
        public DateTime CreatedDTime {get; set; } // Thời gian tạo
        public DateTime UpdatedDTime { get; set; } // Thời gian cập nhật
    }
}
