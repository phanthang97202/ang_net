using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models
{
    public class HashTagNewsModel : BaseModel
    { 
        [Required]
        public string HashTagNewsId { get; set; } = string.Empty; // Mã hashtag
        public string NewsId { get; set; } = string.Empty; // Mã bài viết
        [Required]
        [StringLength(30, ErrorMessage = "HashTagNameIsLimited30Characters")]
        public string HashTagNewsName { get; set; } = string.Empty; // Tên hashtag
        public int Count { get; set; } // Số lần tag 
    }
}
