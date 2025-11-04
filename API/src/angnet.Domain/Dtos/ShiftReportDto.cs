using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Dtos
{
    // Request DTO for creating/updating shift report
    public class CreateShiftReportDto
    {
        [Required]
        public DateOnly ShiftDate { get; set; }

        [Required]
        [MaxLength(50)]
        public string ShiftType { get; set; } = string.Empty;

        [Required]
        public DateTime StartTime { get; set; }

        [Required]
        public DateTime EndTime { get; set; }

        [Required]
        [MaxLength(100)]
        public string ReceptionistName { get; set; } = string.Empty;

        [MaxLength(200)]
        public string ReceiverName { get; set; } = string.Empty;

        public List<TransactionDto> Transactions { get; set; } = new();
        public List<RoomSaleDto> RoomSales { get; set; } = new();
    }

    public class UpdateShiftReportDto : CreateShiftReportDto
    {
        [Required]
        public int Id { get; set; }
    }

    public class TransactionDto
    {
        public int? Id { get; set; }
        public int OrderNumber { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public string InvoiceCode { get; set; } = string.Empty;
        public string CustomerType { get; set; } = string.Empty;
        public decimal? CashAmount { get; set; }
        public decimal? TransferAmount { get; set; }
        public string PrepaidNote { get; set; } = string.Empty;
        public string ExpenseDescription { get; set; } = string.Empty;
        public decimal? ExpenseAmount { get; set; }
        public bool IsUseExpenseForReportRevenue { get; set; }
    }

    public class RoomSaleDto
    {
        public int? Id { get; set; }

        [Required]
        public string RoomNumber { get; set; } = string.Empty;

        [Required]
        public string RoomCategory { get; set; } = string.Empty;

        [Required]
        public decimal UnitPrice { get; set; }
    }

    // Response DTO
    public class ShiftReportResponseDto
    {
        public int Id { get; set; }
        public DateOnly ShiftDate { get; set; }
        public string ShiftType { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string ReceptionistName { get; set; } = string.Empty;
        public decimal TotalCash { get; set; }
        public decimal TotalTransfer { get; set; }
        public decimal TotalExpense { get; set; }
        public decimal HandoverAmount { get; set; }
        public string ReceiverName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<TransactionDto> Transactions { get; set; }
        public List<RoomSaleDto> RoomSales { get; set; }
    }

    // List/Search response
    public class ShiftReportListDto
    {
        public int Id { get; set; }
        public DateOnly ShiftDate { get; set; }
        public string ShiftType { get; set; } = string.Empty;
        public string ReceptionistName { get; set; } = string.Empty;
        public decimal TotalCash { get; set; }
        public decimal TotalTransfer { get; set; }
        public decimal HandoverAmount { get; set; }
        public DateTime CreatedDTime { get; set; }
    }

    // Query parameters
    public class ShiftReportQueryParams
    {
        public DateOnly? FromDate { get; set; }
        public DateOnly? ToDate { get; set; }
        public string ReceptionistName { get; set; } = string.Empty;
        public string ShiftType { get; set; } = string.Empty;
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    // Pagination response
    public class PagedResult<T>
    {
        public List<T> Items { get; set; }
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
        public bool HasPrevious => PageNumber > 1;
        public bool HasNext => PageNumber < TotalPages;
    }

    // ==================== dto for report statistic ====================
    public class RevenueReportQueryParams
    {
        public DateOnly? FromDate { get; set; }
        public DateOnly? ToDate { get; set; }
        public string ReceptionistName { get; set; }
        public string ShiftType { get; set; }
        public string RoomNumber { get; set; }
    }

    // Main revenue report response
    public class RevenueReportResponse
    {
        public RevenueReportSummary Summary { get; set; }
        public List<RevenueByDateDto> RevenueByDate { get; set; }
        public List<RevenueByShiftTypeDto> RevenueByShiftType { get; set; }
        public List<RevenueByReceptionistDto> RevenueByReceptionist { get; set; }
        public List<RevenueByRoomDto> RevenueByRoom { get; set; }
        public List<ShiftReportListDto> Details { get; set; }
    }

    // Summary totals
    public class RevenueReportSummary
    {
        public decimal TotalRevenue { get; set; }
        public decimal TotalCash { get; set; }
        public decimal TotalTransfer { get; set; }
        public decimal TotalExpense { get; set; }
        public decimal NetRevenue { get; set; }
        public int TotalShifts { get; set; }
        public int TotalTransactions { get; set; }
    }

    // Revenue by date
    public class RevenueByDateDto
    {
        public DateOnly Date { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalCash { get; set; }
        public decimal TotalTransfer { get; set; }
        public decimal TotalExpense { get; set; }
        public int ShiftCount { get; set; }
    }

    // Revenue by shift type
    public class RevenueByShiftTypeDto
    {
        public string ShiftType { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalCash { get; set; }
        public decimal TotalTransfer { get; set; }
        public int ShiftCount { get; set; }
    }

    // Revenue by receptionist
    public class RevenueByReceptionistDto
    {
        public string ReceptionistName { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalCash { get; set; }
        public decimal TotalTransfer { get; set; }
        public int ShiftCount { get; set; }
    }

    // Revenue by room
    public class RevenueByRoomDto
    {
        public string RoomNumber { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalCash { get; set; }
        public decimal TotalTransfer { get; set; }
        public int TransactionCount { get; set; }
    }
} 
