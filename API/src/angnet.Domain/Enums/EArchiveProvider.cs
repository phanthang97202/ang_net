namespace angnet.Domain.Enums
{
    /// <summary>
    /// Nơi nội dung của một mục lưu trữ thực sự nằm. Lưu dạng chuỗi (varchar) nên
    /// thêm nguồn mới chỉ cần thêm giá trị ở đây + nhận diện ở ArchiveService và
    /// helper embed-url phía client, không phải đổi bảng.
    /// </summary>
    [System.Text.Json.Serialization.JsonConverter(typeof(System.Text.Json.Serialization.JsonStringEnumConverter))]
    public enum EArchiveProvider
    {
        Cloudinary, // File tự tải lên
        YouTube,
        TikTok,
        Facebook,
        Instagram,
        Web // Link bất kỳ không nhận diện được, hiển thị dạng thẻ link
    }
}
