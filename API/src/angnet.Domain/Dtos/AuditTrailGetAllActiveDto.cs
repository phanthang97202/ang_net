using angnet.Domain.Enums;
using System;
using System.Text.Json.Serialization;
namespace angnet.Domain.Dtos
{
    public class AuditTrailGetAllActiveDto
    {
        public string AuditTrailId { get; set; } = string.Empty;
        public string RecordId { get; set; } = string.Empty; // ID bản ghi bị ảnh hưởng
        public string IPAddress { get; set; } = string.Empty; // Địa chỉ IP của người dùng thực hiện hành động
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public EAuditTrailLevel Level { get; set; } // Mức độ
        public string RequestUrl { get; set; } = string.Empty; // URL được gọi
        [JsonConverter(typeof(JsonStringEnumConverter))]
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
