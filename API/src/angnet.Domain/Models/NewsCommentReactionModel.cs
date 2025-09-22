using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using angnet.Domain.Enums;

namespace angnet.Domain.Models
{
    public class NewsCommentReactionModel : BaseModel
    {
        [Required]
        [ForeignKey("CommentId")]
        public string CommentId { get; set; } = string.Empty;

        [Required]
        [ForeignKey("UserId")]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "varchar(20)")]
        public ENewsCommentReaction ReactionType { get; set; } = ENewsCommentReaction.Like;
    }

}
