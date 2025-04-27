using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SharedModels.Models
{
    public class OrderStadiumStatusLogModel
    {
        [Key]
        [Required]
        public int OrderStadiumLogCode { get; set; } // Primary key
        [ForeignKey("OrderStadiumCode")]
        [Required]
        public string OrderStadiumCode { get; set; } = string.Empty;// FK đến OrderStadiums
        [ForeignKey("UserId")]
        [Required]
        public string UserId { get; set; } = string.Empty;// Ai thực hiện thay đổi (Admin/User)
        public string Status { get; set; } = string.Empty;// Created, Paid, Canceled, Completed
        public string Note { get; set; } = string.Empty;// Ghi chú nếu cần (ví dụ: "Khách hủy do trời mưa")
        public DateTime CreatedDTime { get; set; } // Thời gian tạo
        public DateTime UpdatedDTime { get; set; } // Thời gian cập nhật
    }
}
