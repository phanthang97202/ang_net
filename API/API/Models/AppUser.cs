using Microsoft.AspNetCore.Identity;

namespace API.API.Models
{
    public class AppUser : IdentityUser
    {
        public int TenantId { get; set; } // ID của tenant
        public string FullName { get; set; }
        public string Avatar { get; set; }
        public string Address { get; set; }
        public bool FlagActive { get; set; }
    }
}