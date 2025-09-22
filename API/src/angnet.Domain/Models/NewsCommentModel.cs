using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using angnet.Domain.Enums;

namespace angnet.Domain.Models
{
    public class NewsCommentModel : BaseModel
    {
        [Key]
        [Required]
        public string CommentId { get; set; } = Guid.NewGuid().ToString(); // Mã bình luận

        [Required]
        [ForeignKey("NewsId")]
        public string NewsId { get; set; } = string.Empty; // Bài viết được comment

        [Required]
        [ForeignKey("UserId")]
        public string UserId { get; set; } = string.Empty; // Người viết bình luận 

        public string? ParentCommentId { get; set; } // Nếu là reply cho comment khác

        [Required]
        public string Content { get; set; } = string.Empty; // Nội dung bình luận

        public int ReplyCount { get; set; } = 0; // Số lượt thích
        public int ReactionCount { get; set; } = 0; // Số lượt không thích

        [Column(TypeName = "varchar(20)")]
        public ENewsCommentStatus Status { get; set; } = ENewsCommentStatus.Pending;
        // Pending, Approved, Rejected, Deleted
    }
}
