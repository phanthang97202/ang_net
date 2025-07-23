using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using angnet.Domain.Enums;

namespace angnet.Domain.Models
{
    public class MstTenantContactModel : BaseModel
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public string TenantContactId { get; set; } = string.Empty; // ID
        [Required]
        [ForeignKey("TenantId")]
        public required int TenantId { get; set; } // Tenant ID (ví dụ: "tenant1", "tenant2")
        [Required]
        [Column(TypeName = "varchar(20)")]
        public required ETenantContactName TenantContactName { get; set; } // Tên liên lạc
        [Required]
        public required string TenantContactValue { get; set; } // Giá trị liên lạc (ví dụ: email, số điện thoại)
    }
}
