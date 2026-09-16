using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models
{
    public class EmailDeliveryModel : BaseModel
    {
        public const string PendingStatus = "Pending";
        public const string SucceededStatus = "Succeeded";
        public const string FailedStatus = "Failed";

        [Key]
        public string DeliveryId { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string NewsId { get; set; } = string.Empty;

        [Required]
        public string SubscriberId { get; set; } = string.Empty;

        [Required, StringLength(256)]
        public string Email { get; set; } = string.Empty;

        [Required, StringLength(20)]
        public string Status { get; set; } = PendingStatus;

        public int AttemptCount { get; set; }

        [StringLength(2000)]
        public string? LastError { get; set; }

        public DateTime? SentAt { get; set; }
    }
}
