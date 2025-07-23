using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace angnet.Domain.Models
{
    public class MstStadiumFileModel : BaseModel
    {
        [Key]
        [Required]
        public string StadiumFileId { get; set; } = string.Empty; // Mã file: png, pdf, ...
        public string StadiumCode { get; set; } = string.Empty; // Mã bài viết
        public string FileUrl { get; set; } = string.Empty; // Link file 
    }
}
