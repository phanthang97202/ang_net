namespace angnet.Domain.Dtos
{
    /// <summary>
    /// Yêu cầu dời một danh mục lên/xuống một bậc.
    ///
    /// Client chỉ nói "dời cái này lên", số thứ tự mới do server tính: thứ tự là
    /// của cả nhóm anh em chứ không của riêng một dòng, để client tự tính thì hai
    /// người sửa cùng lúc sẽ ghi đè lẫn nhau.
    /// </summary>
    public class NewsCategoryReorderDto
    {
        public string NewsCategoryId { get; set; } = string.Empty;

        /// <summary>"up" hoặc "down".</summary>
        public string Direction { get; set; } = string.Empty;
    }
}
