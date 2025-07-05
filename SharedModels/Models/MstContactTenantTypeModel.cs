using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using SharedModels.Enums;

namespace SharedModels.Models
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
