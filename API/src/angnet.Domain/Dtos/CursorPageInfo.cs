
namespace angnet.Domain.Dtos
{
    /// <summary>
    /// Phân trang kiểu keyset (cursor) cho feed cuộn vô hạn.
    /// Khác PageInfo (offset): feed thay đổi liên tục nên Skip/Take dễ bị trùng hoặc nhảy item.
    /// </summary>
    public class CursorPageInfo<T>
    {
        public List<T> DataList { get; set; } = new List<T>();
        public string NextCursor { get; set; } = default!; // null khi đã hết dữ liệu
        public bool HasMore { get; set; }
    }
}
