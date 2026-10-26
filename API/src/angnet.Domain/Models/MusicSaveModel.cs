namespace angnet.Domain.Models
{
    /// <summary>
    /// "Đã lưu" (nút bookmark) của một người dùng. Khoá chính (UserId, TrackId)
    /// nên lưu lại lần nữa không tạo bản ghi trùng.
    /// </summary>
    public class MusicSaveModel
    {
        public string UserId { get; set; } = string.Empty;
        public string TrackId { get; set; } = string.Empty;
        public DateTime CreatedDTime { get; set; } // Thời điểm lưu, danh sách "Đã lưu" xếp mới nhất lên đầu
    }
}
