using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Dtos
{
    // Request DTO for creating/updating shift report
    public class CreateShiftReportDto
    {
        [Required]
        public DateTime ShiftDate { get; set; }

        [Required]
        [MaxLength(50)]
        public string ShiftType { get; set; } = string.Empty;

        [Required]
        public TimeSpan StartTime { get; set; }

        [Required]
        public TimeSpan EndTime { get; set; }

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
        public DateTime ShiftDate { get; set; }
        public string ShiftType { get; set; } = string.Empty;
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
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
        public DateTime ShiftDate { get; set; }
        public string ShiftType { get; set; } = string.Empty;
        public string ReceptionistName { get; set; } = string.Empty;
        public decimal TotalCash { get; set; }
        public decimal TotalTransfer { get; set; }
        public decimal HandoverAmount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // Query parameters
    public class ShiftReportQueryParams
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
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


} 
