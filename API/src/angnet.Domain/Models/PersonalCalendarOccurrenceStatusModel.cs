using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models;

// Trạng thái riêng của một buổi trong chuỗi lặp, để đánh dấu xong buổi hôm nay
// không làm thay đổi các buổi khác của chuỗi.
public class PersonalCalendarOccurrenceStatusModel
{
    [MaxLength(36)] public string EventId { get; set; } = "";
    public DateOnly OccurrenceDate { get; set; }
    [Required, MaxLength(16)] public string Status { get; set; } = "todo";
    public DateTime UpdatedAt { get; set; }
}
