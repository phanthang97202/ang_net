namespace angnet.Domain.Enums
{
    [System.Text.Json.Serialization.JsonConverter(typeof(System.Text.Json.Serialization.JsonStringEnumConverter))]
    public enum EMusicTrackAvailability
    {
        Available,
        Unavailable // Nguồn báo bài đã xoá / riêng tư / chặn nhúng - giữ bản chụp để vẫn hiện tên
    }
}
