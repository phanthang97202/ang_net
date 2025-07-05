using SharedModels.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema; 

namespace SharedModels.Models
{
    public class OrderStadiumStatusLogModel : BaseModel
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int OrderStadiumStatusLogId { get; set; } // ID của bản ghi log
        [ForeignKey("OrderId")]
        [Required]
        public int OrderId { get; set; } // FK đến OrderStadiums
        [ForeignKey("UserId")]
        [Required]
        public string UserId { get; set; } = string.Empty; // Ai thực hiện thay đổi (Admin/User)
        public EOrderStatusLog PreviousStatus { get; set; } // Trạng thái trước đó
        public EOrderStatusLog Status { get; set; } // Created, Paid, Canceled, Completed
        public string ChangedData { get; set; } = string.Empty; // Dữ liệu đã thay đổi (nếu có) - ví dụ: {"RentDTimeFrom": "2023-10-01T10:00:00", "RentDTimeTo": "2023-10-01T12:00:00"}
        public string Note { get; set; } = string.Empty; // Ghi chú nếu cần (ví dụ: "Khách hủy do trời mưa")
        public string IpAddress { get; set; } = string.Empty; // Địa chỉ IP của người thực hiện thay đổi (nếu có) 
    }
}
