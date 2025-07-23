using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using angnet.Domain.Enums;

namespace angnet.Domain.Models
{
    public class MstContactTenantTypeModel : BaseModel
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int TenantId { get; set; } // ID 
        public EContactTenantType ContactTenantType { get; set; } 
        public string ContactTenantValue { get; set; } = string.Empty; // Giá trị
    }
}
