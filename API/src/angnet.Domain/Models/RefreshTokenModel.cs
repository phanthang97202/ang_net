using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models
{
    public class RefreshTokenModel : BaseModel
    {
        [Key]
        [Required]
        public required string RefreshToken { get; set; }
        public string TenantId { get; set; } = string.Empty; // Tenant ID (ví dụ: "tenant1", "tenant2")
        [Required]
        public required string UserId { get; set; }
        public DateTime ExpiryDate { get; set; }
        public bool IsRevoked { get; set; } = false;
    }
}
