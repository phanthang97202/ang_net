namespace SharedModels.Enums
{
    public enum EOrderStatus
    {
        Pending,    // Chờ xử lý
        Approved,   // Đã duyệt
        Paid,       // Đã thanh toán
        InDebt,     // Còn nợ
        Cancelled,  // Đã hủy
        Completed   // Hoàn thành (đã sử dụng sân)
    }
}
