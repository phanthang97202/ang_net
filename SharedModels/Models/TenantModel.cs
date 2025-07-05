using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using SharedModels.Enums;

namespace SharedModels.Models
{
    public class TenantModel : BaseModel
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int TenantId { get; set; } // ID 
        [Required]
        public required string TenantName { get; set; } // Tên tenant
        public required string OwnedTenantName { get; set; } // Chủ tenant
        public string TenantDescription { get; set; } = string.Empty; // Mô tả
        public string TenantPrefixUrl { get; set; } = string.Empty; // prefix host name Ex: htpps:hostname.com/<TenantPrefixUrl>
        public string TenantHostUrl {  get; set; } = string.Empty; // host name Ex: htpps:<TenantPrefixUrl>.hostname.com
        public string ConnectionStringDb { get; set; } = string.Empty; // Connection string database (current doesnt use this) 
        public string TenantLogo { get; set; } = string.Empty; // Logo
        [Required]
        public required JsonDocument TenantAddress { get; set; }  // Địa chỉ (Có thể có > 2 địa chỉ)
        [Required]
        public required ETenantStatus TenantStatus {  get; set; }   // Tình trạng
        public string Remark { get; set; } = string.Empty; // Ghi chú
    }
}




