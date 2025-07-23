namespace angnet.Domain.Enums
{
    public enum EWhoCanSee
    {
        Public, // Công khai, ai cũng có thể xem
        Tenant, // Chỉ người dùng trong tenant
        Private // Chỉ người dùng tạo
    }
}
