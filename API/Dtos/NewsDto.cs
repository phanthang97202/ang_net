namespace API.Dtos
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
}
