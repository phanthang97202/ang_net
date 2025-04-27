
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace SharedModels.Models
{
    public class RefreshTokenModel
    {
        [Key]
        public string RefreshToken { get; set; }
        public string UserId { get; set; } 
        public DateTime ExpiryDate { get; set; }
        public bool IsRevoked { get; set; } = false;
    }
}
