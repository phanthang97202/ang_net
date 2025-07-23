using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using angnet.Domain.Enums;

namespace angnet.Domain.Models
{
    public class AuditTrailModel
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AuditTrailId { get; set; }
        public string RecordId { get; set; } = string.Empty; // ID bản ghi bị ảnh hưởng
        public string IPAddress { get; set; } = string.Empty; // Địa chỉ IP của người dùng thực hiện hành động
        public EAuditTrailLevel Level { get; set; } = EAuditTrailLevel.INFORMATION; // Mức độ
        public string RequestUrl { get; set; } = string.Empty; // URL được gọi
        public EAuditTrailType TrailType { get; set; }  // Loại hành động (POST, PUT, DELETE, GET, PATCH)
        public string Description { get; set; } = string.Empty;  // Mô tả hành động đã thực hiện
        public string ChangedColumns { get; set; } = string.Empty;  // Danh sách cột bị thay đổi
        public string OldValues { get; set; } = string.Empty;   // JSON chứa giá trị trước
        public string NewValues { get; set; } = string.Empty;   // JSON chứa giá trị sau
        public string ChangedBy { get; set; } = string.Empty; // Người cập nhật
        public DateTime ChangedDTime { get; set; } // Thời gian 
        public bool IsRevoked { get; set; } = false; // Trạng thái đã bị thu hồi hay chưa
    }
}
