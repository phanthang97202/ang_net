using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace SharedModels.Models
{
    public class TenantStadiumModel
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int TenantStadiumId { get; set; } // ID 
        public string TenantContactTypeCode
    }
}
