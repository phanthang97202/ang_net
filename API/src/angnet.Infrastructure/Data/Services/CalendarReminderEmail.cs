namespace angnet.Infrastructure.Data.Services;

public sealed record CalendarReminderItem(
    string Title,
    DateOnly StartDate,
    DateOnly EndDate,
    string StartTime,
    string EndTime,
    bool AllDay,
    string Location,
    string Notes,
    string Status);

public sealed record CalendarReminderEmail(
    string RecipientName,
    string RecipientEmail,
    DateOnly ReminderDate,
    IReadOnlyList<CalendarReminderItem> Items,
    string CalendarUrl);

public interface ICalendarReminderEmailSender
{
    Task<string> SendAsync(CalendarReminderEmail email, string idempotencyKey, CancellationToken cancellationToken);
}

public sealed class CalendarReminderConfigurationException(string message) : Exception(message);
