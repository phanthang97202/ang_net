namespace SharedModels.Dtos
{
    public class NewsDto
    {
        public string Thumbnail { get; set; } = string.Empty; // Ảnh thu nhỏ bài viết
        public string CategoryNewsId { get; set; } = string.Empty; // Danh mục bài viết
        public string ShortTitle { get; set; } = string.Empty; // Tiêu đề ngắn bài viết
        public string ShortDescription { get; set; } = string.Empty; // Mô tả ngắn bài viết
        public string ContentBody { get; set; } = string.Empty; // Nội dung bài viết
        public bool FlagActive { get; set; } // Trạng thái bài viết

        public List<HashTagNewsDto> LstHashTagNews { get; set; } = new List<HashTagNewsDto>(); // Từ khóa bài viết

        public List<RefFileNewsDto> LstRefFileNews { get; set; } = new List<RefFileNewsDto>(); //  File đính kèm  
    }

    public class RPNewsDto
    {
        public string NewsId { get; set; } = string.Empty; // Mã bài viết
        public string UserId { get; set; } = string.Empty;  // Mã người tạo
        public string UserName { get; set; } = string.Empty; // Tác giả
        public string FullName { get; set; } = string.Empty; // Tác giả
        public string Avatar { get; set; } = string.Empty; // Tác giả
        public string CategoryNewsId { get; set; } = string.Empty; // Mã danh mục
        public string CategoryNewsName { get; set; } = string.Empty; // Tên danh mục
        public string Slug { get; set; } = string.Empty;  // Slug bài viết
        public string Thumbnail { get; set; } = string.Empty;  // Ảnh thu nhỏ bài viết
        public string ShortTitle { get; set; } = string.Empty; // Tiêu đề ngắn bài viết
        public string ShortDescription { get; set; } = string.Empty;  // Mô tả ngắn bài viết
        public string ContentBody { get; set; } = string.Empty; // Nội dung bài viết
        public int EstimatedReadingTime { get; set; } // Ước lượng thời gian đọc
        public DateTime CreatedDTime { get; set; } // Thời gian đăng bài
        public DateTime UpdatedDTime { get; set; } // Thời gian sửa bài
        public bool FlagActive { get; set; } // Trạng thái bài viết
        public int ViewCount { get; set; } // Số lượt xem
        public int ShareCount { get; set; } // Số lượt chia sẻ
        public int LikeCount { get; set; } // Số lượt thích
        public double AvgPoint { get; set; } // Trung bình lượt đánh giá * (thang điểm 10)
        public List<HashTagNewsDto> LstHashTagNews { get; set; } = new List<HashTagNewsDto>(); // Từ khóa bài viết

        public List<RefFileNewsDto> LstRefFileNews { get; set; } = new List<RefFileNewsDto>(); //  File đính kèm  
    }
}
