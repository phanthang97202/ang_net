using System.ComponentModel.DataAnnotations;

namespace SharedModels.Models
{
    public class NewsCategoryModel
    {
        [Key]
        [Required]
        public string NewsCategoryId { get; set; } = string.Empty; // Mã danh mục bài viết
        public string NewsCategoryParentId { get; set; } = string.Empty; // Mã danh mục cha
        [Required]
        public string NewsCategoryName { get; set; } = string.Empty; // Tên danh mục bài viết
        public int NewsCategoryIndex { get; set; } // Số thứ tự
        public bool FlagActive { get; set; } // Trạng thái danh mục
        public DateTime CreatedDTime { get; set; } // Thời gian tạo
        public DateTime UpdatedDTime { get; set; } // Thời gian tạo
    }
}
