namespace angnet.Domain.Enums
{
    /// <summary>
    /// Nguồn phát của một bài hát trong Thư viện nhạc. Lưu dạng chuỗi (varchar)
    /// và DB không có CHECK cho cột này, nên thêm nguồn mới chỉ cần: thêm giá trị
    /// ở đây + một IMusicTrackSource ở server + một adapter phát nhạc ở client.
    /// </summary>
    [System.Text.Json.Serialization.JsonConverter(typeof(System.Text.Json.Serialization.JsonStringEnumConverter))]
    public enum EMusicProvider
    {
        YouTube, // Phát qua YouTube IFrame Player, ExternalId = videoId
        Audius // Phát qua <audio> từ Audius API, ExternalId = track id
    }
}
