using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SharedModels.Models
{
    public class MstStadiumFileModel
    {
        [Key]
        [Required]
        public string StadiumFileId { get; set; } = string.Empty; // Mã file: png, pdf, ...
        public string StadiumCode { get; set; } = string.Empty; // Mã bài viết
        public string FileUrl { get; set; } = string.Empty; // Link file
        public bool FlagActive { get; set; } // Trạng thái danh mục
        public DateTime CreatedDTime { get; set; } // Thời gian tạo
        public DateTime UpdatedDTime { get; set; } // Thời gian tạo
    }
}
