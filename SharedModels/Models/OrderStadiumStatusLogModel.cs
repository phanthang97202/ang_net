using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema; 

namespace SharedModels.Models
{
    public class OrderStadiumStatusLogModel
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int OrderStadiumStatusLogId { get; set; } // ID của bản ghi log
        [ForeignKey("OrderStadiumCode")]
        [Required]
        public string OrderStadiumCode { get; set; } = string.Empty; // FK đến OrderStadiums
        [ForeignKey("UserId")]
        [Required]
        public string UserId { get; set; } = string.Empty; // Ai thực hiện thay đổi (Admin/User)
        public string PreviousStatus { get; set; } = string.Empty; // Trạng thái trước đó
        public string Status { get; set; } = string.Empty;// Created, Paid, Canceled, Completed
        public string ChangedData { get; set; } = string.Empty; // Dữ liệu đã thay đổi (nếu có) - ví dụ: {"RentDTimeFrom": "2023-10-01T10:00:00", "RentDTimeTo": "2023-10-01T12:00:00"}
        public string Note { get; set; } = string.Empty; // Ghi chú nếu cần (ví dụ: "Khách hủy do trời mưa")
        public string IpAddress { get; set; } = string.Empty; // Địa chỉ IP của người thực hiện thay đổi (nếu có)
        public DateTime CreatedDTime { get; set; } // Thời gian tạo
        public DateTime UpdatedDTime { get; set; } // Thời gian cập nhật
    }
}
