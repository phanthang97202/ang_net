using angnet.Domain.Enums;

namespace angnet.Domain.Dtos
{
    public class AuditTrailDto
    { 
        public string RecordId { get; set; } = string.Empty; // ID bản ghi bị ảnh hưởng
        public EAuditTrailLevel Level { get; set; } = EAuditTrailLevel.INFORMATION; // level
        public string Description { get; set; } = string.Empty;  // Mô tả hành động đã thực hiện
        public string ChangedColumns { get; set; } = string.Empty;  // Danh sách cột bị thay đổi
        public string OldValues { get; set; } = string.Empty;   // JSON chứa giá trị trước 
        public string ChangedBy { get; set; } = string.Empty; // Tác nhân hệ thống khi không có người dùng đăng nhập
    }
}
