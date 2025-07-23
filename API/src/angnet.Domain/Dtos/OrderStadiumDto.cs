namespace angnet.Domain.Dtos
{
    public class OrderStadiumDto
    {
        public string UserName { get; set; } = string.Empty; // Mã người dùng
        public DateTime RentDTimeFrom { get; set; } // Đặt từ
        public DateTime RentDTimeTo { get; set; } // Đặt đến
        public string PaymentTypeCode { get; set; } = string.Empty; // Hình thức thanh toán
        public decimal Price { get; set; } // Tiền cọc 
        public decimal Sale { get; set; } // Giảm giá
        public bool FlagFinish { get; set; } // Hoàn thành chưa 
    }
}
