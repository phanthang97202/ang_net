using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using angnet.Domain.Enums;

namespace angnet.Domain.Models
{
    public class TenantModel : BaseModel
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int TenantId { get; set; } // ID 
        [Required]
        public required string TenantCode { get; set; } // tenant code (ví dụ: "tenant1", "tenant2")
        [Required]
        public required string TenantName { get; set; } // Tên tenant
        public required string OwnedBy { get; set; } // Người sở hữu tenant
        public string TenantPrefixHost { get; set; } = string.Empty; // Tiền tố host (ví dụ: "tenant1", "tenant2")
        public string TenantHost { get; set; } = string.Empty; // Host đầy đủ (ví dụ: "tenant1.example.com")
        public string TenantConnectionString { get; set; } = string.Empty; // Chuỗi kết nối đến cơ sở dữ liệu của tenant
        public string TenantDatabaseName { get; set; } = string.Empty; // Tên cơ sở dữ liệu của tenant
        public string TenantLogo { get; set; } = string.Empty; // Logo của tenant
        public string TenantDescription { get; set; } = string.Empty; // Mô tả về tenant
        [Required]
        public required JsonDocument TenantAddress { get; set; } // Địa chỉ của tenant (có thể nhiều địa chỉ)
        [Required]
        [Column(TypeName = "varchar(20)")]
        public ETenantStatus TenantStatus { get; set; } // Trạng thái 
        public string Remark { get; set; } = string.Empty; // Ghi chú
    }
}
