using System;
using System.ComponentModel.DataAnnotations;

namespace SharedModels.Models
{
    public class OrderStadiumModel
    {
        public string OrderId {get; set; } = Guid.NewGuid().ToString(); // Id yêu cầu 
        [Key]
        [Required]
        public string OrderCode { get; set; } = string.Empty; // Mã hóa đơn
        [Required]
        public string StadiumCode {get; set; } = string.Empty; // Mã sân bóng
        [Required]
        public string UserName {get; set; } = string.Empty; // Mã người dùng
        [Required]
        public DateTime OderDTime {get; set; } // Ngày đặt sân
        [Required]
        public DateTime RentDTimeFrom {get; set; } // Đặt từ
        [Required]
        public DateTime RentDTimeTo {get; set; } // Đặt đến
        [Required]
        public string PaymentTypeCode {get; set; } = string.Empty; // Hình thức thanh toán
        [Required]
        public decimal Price {get; set; } // Tiền cọc 
        public decimal Sale {get; set; } // Giảm giá
        public bool FlagFinish {get; set; } // Hoàn thành chưa
        public decimal Owe {get; set; } // Nợ
        public DateTime CreatedDTime {get; set; } // Thời gian tạo
        public DateTime UpdatedDTime { get; set; } // Thời gian cập nhật
    }
}
