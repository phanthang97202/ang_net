using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Security.Claims;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace angnet.WebApi.Controllers;

public class PersonalCalendarEventRequest
{
    [Required, MaxLength(120)] public string Title { get; set; } = "";
    [Required] public string StartDate { get; set; } = "";
    [Required] public string EndDate { get; set; } = "";
    [MaxLength(5)] public string StartTime { get; set; } = "";
    [MaxLength(5)] public string EndTime { get; set; } = "";
    public bool AllDay { get; set; }
    [Required, MaxLength(16)] public string Category { get; set; } = "";
    [MaxLength(200)] public string Location { get; set; } = "";
    [MaxLength(1000)] public string Notes { get; set; } = "";
    public int Version { get; set; }
    public int RepeatDays { get; set; }
    public string? RepeatUntil { get; set; }
    // Chỉ dùng khi tạo (trạng thái ban đầu); để trống khi sửa thì giữ nguyên, trạng
    // thái từng buổi đổi qua PUT {id}/status để sửa nội dung không ghi đè mất.
    [MaxLength(16)] public string? Status { get; set; }
}

public class PersonalCalendarStatusRequest
{
    [Required] public string Date { get; set; } = "";
    [Required, MaxLength(16)] public string Status { get; set; } = "";
}

[ApiController, Route("api/PersonalCalendar"), Authorize(Policy = "calendar.use"), EnableRateLimiting("API")]
public class PersonalCalendarController(AppDbContext db, TimeProvider clock) : ControllerBase
{
    private static readonly string[] Statuses = ["todo", "in_progress", "urgent", "done", "cancelled"];
    private const int TaskLimit = 300;
    private string? OwnerId => User.FindFirstValue(ClaimTypes.NameIdentifier);
    private static bool Date(string? value, out DateOnly date) => DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out date);
    private static bool Time(string? value) => value != null && TimeOnly.TryParseExact(value, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out _);

    [HttpGet, ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> List(string? from, string? to, CancellationToken ct)
    {
        if (OwnerId is not { Length: > 0 } owner) return Unauthorized();
        if (!Date(from, out var start) || !Date(to, out var end) || start > end || end.DayNumber - start.DayNumber > 62) return BadRequest(new { Code = "InvalidRange" });
        var earliestRepeat = DateOnly.FromDayNumber(Math.Max(0, start.DayNumber - 31));
        var items = await db.PersonalCalendarEvent.AsNoTracking().Where(x => x.OwnerId == owner && x.StartDate <= end &&
                (x.RepeatDays == 0 ? x.EndDate >= start : x.RepeatUntil == null || x.RepeatUntil >= earliestRepeat))
            .OrderBy(x => x.StartDate).ThenBy(x => x.StartTime).ThenBy(x => x.EventId).ToListAsync(ct);
        var seriesIds = items.Where(x => x.RepeatDays != 0).Select(x => x.EventId).ToList();
        var occurrenceStatus = seriesIds.Count == 0 ? new Dictionary<(string, DateOnly), string>() : await db.PersonalCalendarOccurrenceStatus.AsNoTracking()
            .Where(x => seriesIds.Contains(x.EventId) && x.OccurrenceDate >= earliestRepeat && x.OccurrenceDate <= end)
            .ToDictionaryAsync(x => (x.EventId, x.OccurrenceDate), x => x.Status, ct);
        return Ok(items.SelectMany(item => Occurrences(item, start, end, date => occurrenceStatus.GetValueOrDefault((item.EventId, date), item.Status)))
            .OrderBy(x => x.StartDate).ThenBy(x => x.StartTime).ThenBy(x => x.EventId));
    }

    // Việc theo trạng thái trên mọi ngày, không chỉ tháng đang xem: sự kiện đơn, các buổi
    // lặp đã đổi trạng thái riêng, và buổi kế tiếp (từ hôm nay) của mỗi chuỗi còn hiệu
    // lực - chuỗi không có ngày kết thúc thì không liệt kê vô hạn các buổi tương lai.
    // "today" là ngày trên thiết bị người dùng. Counts luôn tính trên toàn bộ việc.
    [HttpGet("tasks"), ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> Tasks(string? status, string? today, CancellationToken ct)
    {
        if (OwnerId is not { Length: > 0 } owner) return Unauthorized();
        var day = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        if (status != null && !Statuses.Contains(status) || today != null && !Date(today, out day)) return BadRequest(new { Code = "InvalidStatus" });
        var items = await db.PersonalCalendarEvent.AsNoTracking().Where(x => x.OwnerId == owner).ToListAsync(ct);
        var series = items.Where(x => x.RepeatDays != 0).ToDictionary(x => x.EventId);
        var seriesIds = series.Keys.ToList();
        var overrides = seriesIds.Count == 0 ? new List<PersonalCalendarOccurrenceStatusModel>() : await db.PersonalCalendarOccurrenceStatus.AsNoTracking()
            .Where(x => seriesIds.Contains(x.EventId)).ToListAsync(ct);
        var tasks = items.Where(x => x.RepeatDays == 0).Select(x => ToResponse(x, x.StartDate, x.Status))
            .Concat(overrides.Where(x => IsOccurrence(series[x.EventId], x.OccurrenceDate)).Select(x => ToResponse(series[x.EventId], x.OccurrenceDate, x.Status)))
            .Concat(series.Values.Select(x => (Item: x, Next: NextOccurrence(x, day, overrides))).Where(x => x.Next != null)
                .Select(x => ToResponse(x.Item, x.Next!.Value, x.Item.Status)))
            .ToList();
        var counts = Statuses.ToDictionary(x => x, x => tasks.Count(t => t.Status == x));
        var selected = tasks.Where(x => x.Status == status);
        // Việc đang chờ xếp ngày gần trước; việc đã xong/đã hủy xếp mới nhất trước.
        var ordered = status is "done" or "cancelled"
            ? selected.OrderByDescending(x => x.StartDate).ThenByDescending(x => x.StartTime)
            : selected.OrderBy(x => x.StartDate).ThenBy(x => x.StartTime);
        return Ok(new
        {
            Counts = counts,
            Total = status == null ? tasks.Count : counts[status],
            Items = status == null ? new List<CalendarResponse>() : ordered.ThenBy(x => x.EventId).Take(TaskLimit).ToList()
        });
    }

    [HttpPost, RequestSizeLimit(8192)]
    public async Task<IActionResult> Create(PersonalCalendarEventRequest request, CancellationToken ct)
    {
        if (OwnerId is not { Length: > 0 } owner) return Unauthorized();
        if (!Valid(request, out var start, out var end)) return BadRequest(new { Code = "InvalidEvent" });
        var now = clock.GetUtcNow().UtcDateTime;
        var item = new PersonalCalendarEventModel { EventId = Guid.NewGuid().ToString(), OwnerId = owner, CreatedAt = now, UpdatedAt = now };
        Apply(item, request, start, end);
        if (!string.IsNullOrEmpty(request.Status)) item.Status = request.Status;
        db.PersonalCalendarEvent.Add(item);
        await db.SaveChangesAsync(ct);
        return Ok(ToResponse(item, item.StartDate, item.Status));
    }

    [HttpPut("{id}"), RequestSizeLimit(8192)]
    public async Task<IActionResult> Update(string id, PersonalCalendarEventRequest request, CancellationToken ct)
    {
        if (OwnerId is not { Length: > 0 } owner) return Unauthorized();
        if (!Guid.TryParse(id, out _) || request.Version < 1 || request.Version == int.MaxValue || !Valid(request, out var start, out var end)) return BadRequest(new { Code = "InvalidEvent" });
        var item = await db.PersonalCalendarEvent.SingleOrDefaultAsync(x => x.EventId == id && x.OwnerId == owner, ct);
        if (item == null) return NotFound();
        if (item.Version != request.Version) return Conflict(new { Code = "EventChanged" });
        Apply(item, request, start, end);
        item.Version++;
        item.UpdatedAt = clock.GetUtcNow().UtcDateTime;
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException) { return Conflict(new { Code = "EventChanged" }); }
        return Ok(ToResponse(item, item.StartDate, item.Status));
    }

    // Đổi trạng thái của một buổi: sự kiện đơn đổi ngay trên sự kiện, chuỗi lặp lưu
    // riêng cho ngày đó. Không tăng Version để không làm hỏng form sửa đang mở.
    [HttpPut("{id}/status"), RequestSizeLimit(1024)]
    public async Task<IActionResult> SetStatus(string id, PersonalCalendarStatusRequest request, CancellationToken ct)
    {
        if (OwnerId is not { Length: > 0 } owner) return Unauthorized();
        if (!Guid.TryParse(id, out _) || !Date(request.Date, out var date) || !Statuses.Contains(request.Status)) return BadRequest(new { Code = "InvalidStatus" });
        var item = await db.PersonalCalendarEvent.SingleOrDefaultAsync(x => x.EventId == id && x.OwnerId == owner, ct);
        if (item == null) return NotFound();
        var now = clock.GetUtcNow().UtcDateTime;
        if (item.RepeatDays == 0)
        {
            if (date != item.StartDate) return BadRequest(new { Code = "InvalidStatus" });
            item.Status = request.Status;
            item.UpdatedAt = now;
        }
        else
        {
            if (!IsOccurrence(item, date)) return BadRequest(new { Code = "InvalidStatus" });
            var row = await db.PersonalCalendarOccurrenceStatus.SingleOrDefaultAsync(x => x.EventId == id && x.OccurrenceDate == date, ct);
            if (row == null) db.PersonalCalendarOccurrenceStatus.Add(new PersonalCalendarOccurrenceStatusModel { EventId = id, OccurrenceDate = date, Status = request.Status, UpdatedAt = now });
            else { row.Status = request.Status; row.UpdatedAt = now; }
        }
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateException) { return Conflict(new { Code = "EventChanged" }); }
        return Ok(ToResponse(item, date, request.Status));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, int version, CancellationToken ct)
    {
        if (OwnerId is not { Length: > 0 } owner) return Unauthorized();
        if (!Guid.TryParse(id, out _) || version < 1) return BadRequest(new { Code = "InvalidEvent" });
        var item = await db.PersonalCalendarEvent.SingleOrDefaultAsync(x => x.EventId == id && x.OwnerId == owner, ct);
        if (item == null) return NotFound();
        if (item.Version != version) return Conflict(new { Code = "EventChanged" });
        db.PersonalCalendarEvent.Remove(item);
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException) { return Conflict(new { Code = "EventChanged" }); }
        return NoContent();
    }

    private static bool Valid(PersonalCalendarEventRequest r, out DateOnly start, out DateOnly end)
    {
        start = default; end = default;
        return !string.IsNullOrWhiteSpace(r.Title) && r.Title.Trim().Length <= 120 &&
            Date(r.StartDate, out start) && Date(r.EndDate, out end) && start <= end &&
            r.RepeatDays is >= 0 and <= 127 && (r.RepeatDays == 0 || end.DayNumber - start.DayNumber <= 31) &&
            (string.IsNullOrEmpty(r.RepeatUntil) || r.RepeatDays != 0 && Date(r.RepeatUntil, out var until) && until >= start) &&
            r.Category is "personal" or "leisure" or "routine" or "work" &&
            (string.IsNullOrEmpty(r.Status) || Statuses.Contains(r.Status)) &&
            (r.Location?.Length ?? 0) <= 200 && (r.Notes?.Length ?? 0) <= 1000 &&
            (r.AllDay || Time(r.StartTime) && Time(r.EndTime) && (start < end || string.CompareOrdinal(r.StartTime, r.EndTime) < 0));
    }
    private static void Apply(PersonalCalendarEventModel item, PersonalCalendarEventRequest r, DateOnly start, DateOnly end)
    {
        item.Title = r.Title.Trim(); item.StartDate = start; item.EndDate = end;
        item.RepeatDays = r.RepeatDays; item.RepeatUntil = string.IsNullOrEmpty(r.RepeatUntil) ? null : DateOnly.ParseExact(r.RepeatUntil, "yyyy-MM-dd", CultureInfo.InvariantCulture);
        item.StartTime = r.AllDay ? "" : r.StartTime; item.EndTime = r.AllDay ? "" : r.EndTime;
        item.AllDay = r.AllDay; item.Category = r.Category; item.Location = (r.Location ?? "").Trim(); item.Notes = (r.Notes ?? "").Trim();
    }
    private sealed record CalendarResponse(string EventId, string Title, DateOnly StartDate, DateOnly EndDate, string StartTime, string EndTime,
        bool AllDay, string Category, string Location, string Notes, int Version, DateTime CreatedAt, DateTime UpdatedAt,
        int RepeatDays, DateOnly? RepeatUntil, DateOnly SeriesStartDate, DateOnly SeriesEndDate, string Status);

    private static CalendarResponse ToResponse(PersonalCalendarEventModel item, DateOnly start, string status) => new(
        item.EventId, item.Title, start, start.AddDays(item.EndDate.DayNumber - item.StartDate.DayNumber), item.StartTime, item.EndTime,
        item.AllDay, item.Category, item.Location, item.Notes, item.Version, item.CreatedAt, item.UpdatedAt,
        item.RepeatDays, item.RepeatUntil, item.StartDate, item.EndDate, status);

    private static bool IsOccurrence(PersonalCalendarEventModel item, DateOnly date) =>
        date >= item.StartDate && (item.RepeatUntil == null || date <= item.RepeatUntil) &&
        (item.RepeatDays & (1 << (int)date.DayOfWeek)) != 0;

    // Buổi đầu tiên từ "from" chưa được đổi trạng thái riêng (buổi đã đổi riêng đã có trong
    // danh sách việc). Chuỗi đã kết thúc trước "from" thì không có buổi kế tiếp.
    private static DateOnly? NextOccurrence(PersonalCalendarEventModel item, DateOnly from, List<PersonalCalendarOccurrenceStatusModel> overrides)
    {
        var date = item.StartDate > from ? item.StartDate : from;
        for (var i = 0; i < 400 && date < DateOnly.MaxValue; i++, date = date.AddDays(1))
        {
            if (item.RepeatUntil is { } until && date > until) return null;
            if (IsOccurrence(item, date) && !overrides.Any(x => x.EventId == item.EventId && x.OccurrenceDate == date)) return date;
        }
        return null;
    }

    private static IEnumerable<CalendarResponse> Occurrences(PersonalCalendarEventModel item, DateOnly from, DateOnly to, Func<DateOnly, string> statusFor)
    {
        if (item.RepeatDays == 0) { yield return ToResponse(item, item.StartDate, item.Status); yield break; }
        var duration = item.EndDate.DayNumber - item.StartDate.DayNumber;
        var first = Math.Max(item.StartDate.DayNumber, from.DayNumber - duration);
        var last = Math.Min(to.DayNumber, item.RepeatUntil?.DayNumber ?? DateOnly.MaxValue.DayNumber - duration);
        last = Math.Min(last, DateOnly.MaxValue.DayNumber - duration);
        for (var n = first; n <= last; n++)
        {
            var date = DateOnly.FromDayNumber(n);
            if ((item.RepeatDays & (1 << (int)date.DayOfWeek)) != 0) yield return ToResponse(item, date, statusFor(date));
        }
    }
}
