using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using angnet.Domain.Enums;

namespace angnet.Domain.Models
{
    public class NewsCommentMediaModel : BaseModel
    {
        [Key]
        [Required]
        public string MediaId { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [ForeignKey("CommentId")]
        public string CommentId { get; set; } = string.Empty;

        [Required]
        public string Url { get; set; } = string.Empty; // link ảnh / video

        [Column(TypeName = "varchar(20)")]
        public ENewsCommentMedia MediaType { get; set; } = ENewsCommentMedia.Image; // Image, Video, GIF, File
    }

}
