namespace angnet.Domain.Enums
{
    [System.Text.Json.Serialization.JsonConverter(typeof(System.Text.Json.Serialization.JsonStringEnumConverter))]
    public enum EArchiveVisibility
    {
        Private, // Chỉ chủ sở hữu xem được - kể cả Admin cũng không
        Unlisted, // Ai có link thì xem được, nhưng không được liệt kê ở đâu
        Public // Công khai
    }
}
