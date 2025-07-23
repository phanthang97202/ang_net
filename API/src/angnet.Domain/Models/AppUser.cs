using Microsoft.AspNetCore.Identity;

namespace angnet.Domain.Models
{
    public class AppUser : IdentityUser
    {
        public int TenantId { get; set; } // ID của tenant
        public string FullName { get; set; } = string.Empty;
        public string Avatar { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public bool FlagActive { get; set; }
        public DateTime CreatedDTime { get; set; } // Thời gian tạo
        public DateTime UpdatedDTime { get; set; } // Thời gian tạo
    }
}
