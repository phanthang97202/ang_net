using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Dtos;

public class EzCloudImportRequestDto
{
    [Required, MaxLength(16384)]
    public string AccessToken { get; set; } = string.Empty;

    [Required]
    public DateTimeOffset StartTime { get; set; }

    [Required]
    public DateTimeOffset EndTime { get; set; }
}

public class EzCloudImportSummaryDto
{
    public int TransactionCount { get; set; }
    public int SkippedDeletedCount { get; set; }
    public decimal TotalCash { get; set; }
    public decimal TotalTransfer { get; set; }
    public decimal TotalExpense { get; set; }
}

public class EzCloudTransactionDto : TransactionDto
{
    // Giờ lập phiếu thu/chi sớm nhất của dòng trên ezCloud (ISO 8601), chỉ để xem trước.
    public string? PaymentTime { get; set; }
}

public class EzCloudImportResultDto
{
    public List<EzCloudTransactionDto> Transactions { get; set; } = [];
    public EzCloudImportSummaryDto Summary { get; set; } = new();
    public List<string> Warnings { get; set; } = [];
}
