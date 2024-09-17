using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class MstStadiumStatusModel
    {
        [Key]
        [Required]
        public string StadiumStatusCode { get; set; } = string.Empty; // Mã tình trạng sân => A-Active, R-Repair, B-Broken 
        [Required]
        public string StadiumStatusName { get; set; } = string.Empty; // Tên tình trạng
        public bool FlagActive {  get; set; } // Trạng thái
        public DateTime CreatedDTime { get; set; } // Thời gian tạo
        public DateTime UpdatedDTime { get; set; } // Thời gian tạo
    }
}
