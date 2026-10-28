using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models;

public class PersonalCalendarEventModel
{
    [Key, MaxLength(36)] public string EventId { get; set; } = "";
    [Required] public string OwnerId { get; set; } = "";
    [Required, MaxLength(120)] public string Title { get; set; } = "";
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int RepeatDays { get; set; }
    public DateOnly? RepeatUntil { get; set; }
    [MaxLength(5)] public string StartTime { get; set; } = "";
    [MaxLength(5)] public string EndTime { get; set; } = "";
    public bool AllDay { get; set; }
    [Required, MaxLength(16)] public string Category { get; set; } = "personal";
    // Sự kiện đơn: trạng thái của chính nó. Chuỗi lặp: trạng thái mặc định của các
    // buổi chưa được đổi riêng (xem PersonalCalendarOccurrenceStatusModel).
    [Required, MaxLength(16)] public string Status { get; set; } = "todo";
    [MaxLength(200)] public string Location { get; set; } = "";
    [MaxLength(1000)] public string Notes { get; set; } = "";
    public int Version { get; set; } = 1;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
