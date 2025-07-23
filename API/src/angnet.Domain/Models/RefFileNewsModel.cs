using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models
{
    public class RefFileNewsModel : BaseModel
    {
        [Key]
        [Required]
        public string RefFileNewsId { get; set; } = string.Empty; // Mã file đính kèm 
        public string NewsId { get; set; } = string.Empty; // Mã bài viết
        public string FileUrl { get; set; } = string.Empty; // Link file 
    }
}
