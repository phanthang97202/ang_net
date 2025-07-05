using System.ComponentModel.DataAnnotations;

namespace SharedModels.Models
{
    public class PointNewsModel : BaseModel
    {
        // modelBuilder.Entity<PointNews>().HasKey(p => new { p.NewsId, p.UserId });
        [Required]
        public string NewsId { get; set; } = string.Empty; // Mã bài viết 
        [Required]
        public string UserId { get; set; } = string.Empty; // Người cho điểm bài viết
        [Range(0, 10, ErrorMessage = "PointEmbraceInRangeFrom0To10")]
        public double Point { get; set; } // Điểm bài viết 

        //
        // public NewsModel News { get; set; } = new NewsModel();
        // public AppUser AppUser { get; set; } = new AppUser();

    }
}
