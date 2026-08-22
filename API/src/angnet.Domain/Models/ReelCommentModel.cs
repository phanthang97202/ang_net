using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models
{
    public class ReelCommentModel : BaseModel
    {
        [Key]
        [Required]
        public string CommentId { get; set; } = Guid.NewGuid().ToString(); // Mã bình luận

        [Required]
        [ForeignKey("ReelId")]
        public string ReelId { get; set; } = string.Empty; // Reel được comment

        [Required]
        [ForeignKey("UserId")]
        public string UserId { get; set; } = string.Empty; // Người viết bình luận

        public string? ParentCommentId { get; set; } // Nếu là reply cho comment khác

        [Required]
        public string Content { get; set; } = string.Empty; // Nội dung bình luận
        public int ReplyCount { get; set; } = 0; // Số lượt reply
    }
}
