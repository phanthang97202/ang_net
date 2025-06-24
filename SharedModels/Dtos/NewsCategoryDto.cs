namespace SharedModels.Dtos
{
    public class NewsCategoryDto
    {
        public string NewsCategoryId { get; set; } = string.Empty; // Mã danh mục bài viết
        public string NewsCategoryParentId { get; set; } = string.Empty; // Mã danh mục cha 
        public string NewsCategoryName { get; set; } = string.Empty; // Tên danh mục bài viết
        public int NewsCategoryIndex { get; set; } // Số thứ tự
    }
}
