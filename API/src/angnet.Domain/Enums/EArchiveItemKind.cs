namespace angnet.Domain.Enums
{
    [System.Text.Json.Serialization.JsonConverter(typeof(System.Text.Json.Serialization.JsonStringEnumConverter))]
    public enum EArchiveItemKind
    {
        Image, // Ảnh tự tải lên
        Video, // Video tự tải lên
        Link // Link ngoài: YouTube, TikTok, Facebook, Instagram, trang web bất kỳ
    }
}
