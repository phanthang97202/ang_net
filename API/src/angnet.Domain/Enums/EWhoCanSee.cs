namespace angnet.Domain.Enums
{
    [System.Text.Json.Serialization.JsonConverter(typeof(System.Text.Json.Serialization.JsonStringEnumConverter))]
    public enum EWhoCanSee
    {
        Public, // Công khai, ai cũng có thể xem
        Tenant, // Chỉ người dùng trong tenant
        Private // Chỉ người dùng tạo
    }
}
