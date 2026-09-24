namespace angnet.Domain.Dtos
{
    public class NewsCategoryDto
    {
        public string NewsCategoryId { get; set; } = string.Empty; // Mã danh mục bài viết
        public string NewsCategoryParentId { get; set; } = string.Empty; // Mã danh mục cha 
        public string NewsCategoryName { get; set; } = string.Empty; // Tên tiếng Việt
        public string NewsCategoryNameEn { get; set; } = string.Empty; // Tên tiếng Anh
        public string NewsCategoryLogo { get; set; } = string.Empty; // URL logo danh mục
        public int NewsCategoryIndex { get; set; } // Số thứ tự
    }
}
