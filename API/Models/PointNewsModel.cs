using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class PointNewsModel
    {
        // modelBuilder.Entity<PointNews>().HasKey(p => new { p.NewsId, p.UserId });
        [Required]
        public string NewsId { get; set; } = string.Empty; // Mã bài viết 
        [Required]
        public string UserId { get; set; } = string.Empty; // Người cho điểm bài viết
        public double Point { get; set; } // Điểm bài viết
        public bool FlagActive { get; set; } // Trạng thái danh mục
        public DateTime CreatedDTime { get; set; } // Thời gian tạo
        public DateTime UpdatedDTime { get; set; } // Thời gian tạo

        //
        // public NewsModel News { get; set; } = new NewsModel();
        // public AppUser AppUser { get; set; } = new AppUser();

    }
}
