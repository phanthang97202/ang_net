namespace angnet.Domain.Dtos
{
    /// <summary>
    /// Một danh mục gốc kèm vài bài tiêu biểu, dùng cho khối "Khám phá theo chủ đề"
    /// ngoài trang chủ. Chỉ mang đúng số trường để vẽ được thẻ danh mục - không
    /// dùng RPNewsDto vì bản đó kéo theo ContentBody, hashtag, file đính kèm,
    /// điểm đánh giá... cho từng bài, quá nặng so với một khối xem trước.
    /// </summary>
    public class NewsCategoryPreviewDto
    {
        public string NewsCategoryId { get; set; } = string.Empty;
        public string NewsCategoryName { get; set; } = string.Empty;
        public int NewsCategoryIndex { get; set; }

        /// <summary>Tổng số bài đã xuất bản của danh mục này, tính cả các danh mục con.</summary>
        public int TotalCount { get; set; }

        /// <summary>Các danh mục con trực tiếp, để hiện thành chip trong thẻ.</summary>
        public List<NewsCategoryDto> Children { get; set; } = new List<NewsCategoryDto>();

        public List<NewsCategoryPreviewItemDto> Posts { get; set; } = new List<NewsCategoryPreviewItemDto>();
    }

    public class NewsCategoryPreviewItemDto
    {
        public string NewsId { get; set; } = string.Empty;
        public string CategoryNewsId { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Thumbnail { get; set; } = string.Empty;
        public string ShortTitle { get; set; } = string.Empty;
        public DateTime CreatedDTime { get; set; }
    }
}
