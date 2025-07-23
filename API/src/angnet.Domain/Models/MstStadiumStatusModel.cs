using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models
{
    public class MstStadiumStatusModel : BaseModel
    {
        [Key]
        [Required]
        public string StadiumStatusCode { get; set; } = string.Empty; // Mã tình trạng sân => A-Active, R-Repair, B-Broken 
        [Required]
        public string StadiumStatusName { get; set; } = string.Empty; // Tên tình trạng 
    }
}
