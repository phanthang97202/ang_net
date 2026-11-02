using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models;

/// <summary>
/// One delivery per account and local calendar date. The composite primary key is
/// the durable idempotency boundary for the reminder trigger.
/// </summary>
public class PersonalCalendarReminderDeliveryModel
{
    public const string ProcessingStatus = "processing";
    public const string SentStatus = "sent";
    public const string FailedStatus = "failed";

    public string OwnerId { get; set; } = string.Empty;
    public DateOnly ReminderDate { get; set; }
    [Required, MaxLength(16)] public string Status { get; set; } = ProcessingStatus;
    public int AttemptCount { get; set; }
    [MaxLength(2000)] public string? LastError { get; set; }
    [MaxLength(100)] public string? ProviderMessageId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? SentAt { get; set; }
}
