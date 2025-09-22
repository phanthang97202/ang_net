using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using angnet.Domain.Enums;

namespace angnet.Domain.Models
{
    public class NewsReportCommentModel
    {
        [Key]
        [Required]
        public string ReportId { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [ForeignKey("CommentId")]
        public string CommentId { get; set; } = string.Empty;

        [Required]
        [ForeignKey("UserId")]
        public string UserId { get; set; } = string.Empty; // Người báo cáo

        [Required]
        [Column(TypeName = "varchar(50)")]
        public ENewsCommentReportReason Reason { get; set; } = ENewsCommentReportReason.Other;

        public string Description { get; set; } = string.Empty; // Chi tiết thêm

        [Column(TypeName = "varchar(20)")]
        public ENewsCommentReportStatus Status { get; set; } = ENewsCommentReportStatus.Pending; // Trạng thái xử lý
    }
}
