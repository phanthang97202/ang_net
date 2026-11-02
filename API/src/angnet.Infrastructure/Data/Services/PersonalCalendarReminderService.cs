using System.Globalization;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using angnet.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace angnet.Infrastructure.Data.Services;

public sealed record CalendarReminderRunResult(
    string State,
    DateOnly LocalDate,
    string ScheduledTime,
    int EligibleAccounts,
    int Sent,
    int AlreadyProcessed,
    int SkippedWithoutEmail,
    int Failed);

public interface IPersonalCalendarReminderService
{
    Task<CalendarReminderRunResult> RunAsync(CancellationToken cancellationToken);
}

public sealed class PersonalCalendarReminderService(
    AppDbContext db,
    ICalendarReminderEmailSender emailSender,
    IConfiguration configuration,
    TimeProvider clock,
    ILogger<PersonalCalendarReminderService> logger) : IPersonalCalendarReminderService
{
    public const string EnabledParameter = "PERSONAL_CALENDAR_REMINDER_ENABLED";
    public const string TimeParameter = "PERSONAL_CALENDAR_REMINDER_TIME";
    private static readonly TimeZoneInfo VietnamTimeZone = ResolveVietnamTimeZone();
    private static readonly TimeSpan ProcessingLease = TimeSpan.FromMinutes(15);
    private static readonly HashSet<string> FinishedStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "done", "cancelled"
    };

    public async Task<CalendarReminderRunResult> RunAsync(CancellationToken cancellationToken)
    {
        var parameters = await db.SysParameter.AsNoTracking()
            .Where(x => x.FlagActive && (x.ParameterCode == EnabledParameter || x.ParameterCode == TimeParameter))
            .ToDictionaryAsync(x => x.ParameterCode, cancellationToken);

        if (!parameters.TryGetValue(EnabledParameter, out var enabledParameter) ||
            !bool.TryParse(Value(enabledParameter), out var enabled))
        {
            throw new CalendarReminderConfigurationException(
                $"System parameter {EnabledParameter} is missing or invalid.");
        }

        if (!parameters.TryGetValue(TimeParameter, out var timeParameter) ||
            !TimeOnly.TryParseExact(Value(timeParameter), "HH:mm", CultureInfo.InvariantCulture,
                DateTimeStyles.None, out var scheduledTime))
        {
            throw new CalendarReminderConfigurationException(
                $"System parameter {TimeParameter} must use HH:mm format.");
        }

        var now = clock.GetUtcNow();
        var localNow = TimeZoneInfo.ConvertTime(now, VietnamTimeZone);
        var localDate = DateOnly.FromDateTime(localNow.DateTime);
        var scheduled = scheduledTime.ToString("HH:mm", CultureInfo.InvariantCulture);

        if (!enabled)
        {
            return Empty("disabled", localDate, scheduled);
        }

        if (TimeOnly.FromDateTime(localNow.DateTime) < scheduledTime)
        {
            return Empty("not_due", localDate, scheduled);
        }

        var dueItems = await LoadDueItemsAsync(localDate, cancellationToken);
        if (dueItems.Count == 0)
        {
            return Empty("no_tasks", localDate, scheduled);
        }

        var ownerIds = dueItems.Select(x => x.OwnerId).Distinct().ToList();
        var users = await db.Users.AsNoTracking()
            .Where(x => ownerIds.Contains(x.Id) && x.FlagActive)
            .ToDictionaryAsync(x => x.Id, cancellationToken);

        var sent = 0;
        var alreadyProcessed = 0;
        var skippedWithoutEmail = 0;
        var failed = 0;
        var eligibleAccounts = 0;
        var nowUtc = now.UtcDateTime;
        var calendarUrl = configuration["CalendarReminder:CalendarUrl"]?.Trim();
        if (string.IsNullOrWhiteSpace(calendarUrl)) calendarUrl = "https://phanthang.site/calendar";

        foreach (var group in dueItems.GroupBy(x => x.OwnerId))
        {
            if (!users.TryGetValue(group.Key, out var user) ||
                string.IsNullOrWhiteSpace(user.Email) ||
                !MailAddress.TryCreate(user.Email, out _))
            {
                skippedWithoutEmail++;
                continue;
            }

            eligibleAccounts++;
            if (!await TryClaimAsync(group.Key, localDate, nowUtc, cancellationToken))
            {
                alreadyProcessed++;
                continue;
            }

            try
            {
                var items = group.OrderBy(x => x.Item.AllDay ? 0 : 1)
                    .ThenBy(x => x.Item.StartTime)
                    .ThenBy(x => x.Item.Title)
                    .Select(x => x.Item)
                    .ToList();
                var recipientName = string.IsNullOrWhiteSpace(user.FullName)
                    ? user.UserName ?? "bạn"
                    : user.FullName.Trim();
                var messageId = await emailSender.SendAsync(
                    new CalendarReminderEmail(recipientName, user.Email, localDate, items, calendarUrl),
                    IdempotencyKey(group.Key, localDate),
                    cancellationToken);
                await MarkSentAsync(group.Key, localDate, messageId, clock.GetUtcNow().UtcDateTime,
                    cancellationToken);
                sent++;
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (CalendarReminderConfigurationException exception)
            {
                await MarkFailedAsync(group.Key, localDate, exception, clock.GetUtcNow().UtcDateTime,
                    cancellationToken);
                throw;
            }
            catch (Exception exception)
            {
                failed++;
                await MarkFailedAsync(group.Key, localDate, exception, clock.GetUtcNow().UtcDateTime,
                    cancellationToken);
                logger.LogError(exception,
                    "Could not send the personal calendar reminder for owner {OwnerId} on {ReminderDate}",
                    group.Key, localDate);
            }
        }

        return new CalendarReminderRunResult(
            failed > 0 ? "partially_failed" : "completed",
            localDate,
            scheduled,
            eligibleAccounts,
            sent,
            alreadyProcessed,
            skippedWithoutEmail,
            failed);
    }

    private async Task<List<OwnedReminderItem>> LoadDueItemsAsync(
        DateOnly localDate,
        CancellationToken cancellationToken)
    {
        var earliestOccurrence = localDate.AddDays(-31);
        var events = await db.PersonalCalendarEvent.AsNoTracking()
            .Where(x => x.StartDate <= localDate &&
                (x.RepeatDays == 0 && x.EndDate >= localDate ||
                 x.RepeatDays != 0 && (x.RepeatUntil == null || x.RepeatUntil >= earliestOccurrence)))
            .ToListAsync(cancellationToken);

        var seriesIds = events.Where(x => x.RepeatDays != 0).Select(x => x.EventId).ToList();
        var overrides = seriesIds.Count == 0
            ? new Dictionary<(string EventId, DateOnly Date), string>()
            : await db.PersonalCalendarOccurrenceStatus.AsNoTracking()
                .Where(x => seriesIds.Contains(x.EventId) &&
                    x.OccurrenceDate >= earliestOccurrence && x.OccurrenceDate <= localDate)
                .ToDictionaryAsync(x => (x.EventId, x.OccurrenceDate), x => x.Status,
                    cancellationToken);

        var result = new List<OwnedReminderItem>();
        foreach (var item in events)
        {
            if (item.RepeatDays == 0)
            {
                if (!FinishedStatuses.Contains(item.Status))
                {
                    result.Add(new OwnedReminderItem(item.OwnerId,
                        ToReminderItem(item, item.StartDate, item.Status)));
                }
                continue;
            }

            var duration = item.EndDate.DayNumber - item.StartDate.DayNumber;
            var first = Math.Max(item.StartDate.DayNumber, localDate.DayNumber - duration);
            for (var dayNumber = first; dayNumber <= localDate.DayNumber; dayNumber++)
            {
                var occurrence = DateOnly.FromDayNumber(dayNumber);
                if (item.RepeatUntil is { } until && occurrence > until) continue;
                if ((item.RepeatDays & (1 << (int)occurrence.DayOfWeek)) == 0) continue;
                var status = overrides.GetValueOrDefault((item.EventId, occurrence), item.Status);
                if (!FinishedStatuses.Contains(status))
                {
                    result.Add(new OwnedReminderItem(item.OwnerId,
                        ToReminderItem(item, occurrence, status)));
                }
            }
        }

        return result;
    }

    private async Task<bool> TryClaimAsync(
        string ownerId,
        DateOnly reminderDate,
        DateTime nowUtc,
        CancellationToken cancellationToken)
    {
        var existing = await db.PersonalCalendarReminderDelivery.AsNoTracking()
            .SingleOrDefaultAsync(x => x.OwnerId == ownerId && x.ReminderDate == reminderDate,
                cancellationToken);
        if (existing == null)
        {
            var delivery = new PersonalCalendarReminderDeliveryModel
            {
                OwnerId = ownerId,
                ReminderDate = reminderDate,
                Status = PersonalCalendarReminderDeliveryModel.ProcessingStatus,
                AttemptCount = 1,
                CreatedAt = nowUtc,
                UpdatedAt = nowUtc
            };
            db.PersonalCalendarReminderDelivery.Add(delivery);
            try
            {
                await db.SaveChangesAsync(cancellationToken);
                return true;
            }
            catch (DbUpdateException)
            {
                db.Entry(delivery).State = EntityState.Detached;
                existing = await db.PersonalCalendarReminderDelivery.AsNoTracking()
                    .SingleOrDefaultAsync(x => x.OwnerId == ownerId && x.ReminderDate == reminderDate,
                        cancellationToken);
                if (existing == null) throw;
            }
        }

        if (existing.Status == PersonalCalendarReminderDeliveryModel.SentStatus) return false;
        var staleBefore = nowUtc.Subtract(ProcessingLease);
        var claimed = await db.PersonalCalendarReminderDelivery
            .Where(x => x.OwnerId == ownerId && x.ReminderDate == reminderDate &&
                x.Status != PersonalCalendarReminderDeliveryModel.SentStatus &&
                (x.Status != PersonalCalendarReminderDeliveryModel.ProcessingStatus || x.UpdatedAt <= staleBefore))
            .ExecuteUpdateAsync(update => update
                .SetProperty(x => x.Status, PersonalCalendarReminderDeliveryModel.ProcessingStatus)
                .SetProperty(x => x.AttemptCount, x => x.AttemptCount + 1)
                .SetProperty(x => x.LastError, (string?)null)
                .SetProperty(x => x.UpdatedAt, nowUtc), cancellationToken);
        return claimed == 1;
    }

    private Task MarkSentAsync(
        string ownerId,
        DateOnly reminderDate,
        string providerMessageId,
        DateTime nowUtc,
        CancellationToken cancellationToken)
    {
        var boundedMessageId = providerMessageId.Length <= 100
            ? providerMessageId
            : providerMessageId[..100];
        return db.PersonalCalendarReminderDelivery
            .Where(x => x.OwnerId == ownerId && x.ReminderDate == reminderDate)
            .ExecuteUpdateAsync(update => update
                .SetProperty(x => x.Status, PersonalCalendarReminderDeliveryModel.SentStatus)
                .SetProperty(x => x.ProviderMessageId, boundedMessageId)
                .SetProperty(x => x.LastError, (string?)null)
                .SetProperty(x => x.SentAt, nowUtc)
                .SetProperty(x => x.UpdatedAt, nowUtc), cancellationToken);
    }

    private Task MarkFailedAsync(
        string ownerId,
        DateOnly reminderDate,
        Exception exception,
        DateTime nowUtc,
        CancellationToken cancellationToken)
    {
        var error = exception.Message.Length <= 2000 ? exception.Message : exception.Message[..2000];
        return db.PersonalCalendarReminderDelivery
            .Where(x => x.OwnerId == ownerId && x.ReminderDate == reminderDate)
            .ExecuteUpdateAsync(update => update
                .SetProperty(x => x.Status, PersonalCalendarReminderDeliveryModel.FailedStatus)
                .SetProperty(x => x.LastError, error)
                .SetProperty(x => x.UpdatedAt, nowUtc), cancellationToken);
    }

    private static CalendarReminderItem ToReminderItem(
        PersonalCalendarEventModel item,
        DateOnly occurrence,
        string status) => new(
        item.Title,
        occurrence,
        occurrence.AddDays(item.EndDate.DayNumber - item.StartDate.DayNumber),
        item.StartTime,
        item.EndTime,
        item.AllDay,
        item.Location,
        item.Notes,
        status);

    private static string Value(SysParameterModel parameter) =>
        string.IsNullOrWhiteSpace(parameter.ParameterValueVi)
            ? parameter.ParameterValueEn.Trim()
            : parameter.ParameterValueVi.Trim();

    private static CalendarReminderRunResult Empty(string state, DateOnly date, string scheduledTime) =>
        new(state, date, scheduledTime, 0, 0, 0, 0, 0);

    private static string IdempotencyKey(string ownerId, DateOnly date)
    {
        var ownerHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(ownerId)))
            .ToLowerInvariant()[..24];
        return $"calendar-{date:yyyyMMdd}-{ownerHash}";
    }

    private static TimeZoneInfo ResolveVietnamTimeZone()
    {
        foreach (var id in new[] { "Asia/Ho_Chi_Minh", "SE Asia Standard Time" })
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
            catch (TimeZoneNotFoundException) { }
            catch (InvalidTimeZoneException) { }
        }

        return TimeZoneInfo.CreateCustomTimeZone(
            "Vietnam Standard Time",
            TimeSpan.FromHours(7),
            "Vietnam Standard Time",
            "Vietnam Standard Time");
    }

    private sealed record OwnedReminderItem(string OwnerId, CalendarReminderItem Item);
}
