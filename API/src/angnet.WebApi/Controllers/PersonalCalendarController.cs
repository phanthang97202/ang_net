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
}

[ApiController, Route("api/PersonalCalendar"), Authorize(Policy = "calendar.use"), EnableRateLimiting("API")]
public class PersonalCalendarController(AppDbContext db, TimeProvider clock) : ControllerBase
{
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
        return Ok(items.SelectMany(item => Occurrences(item, start, end)).OrderBy(x => x.StartDate).ThenBy(x => x.StartTime).ThenBy(x => x.EventId));
    }

    [HttpPost, RequestSizeLimit(8192)]
    public async Task<IActionResult> Create(PersonalCalendarEventRequest request, CancellationToken ct)
    {
        if (OwnerId is not { Length: > 0 } owner) return Unauthorized();
        if (!Valid(request, out var start, out var end)) return BadRequest(new { Code = "InvalidEvent" });
        var now = clock.GetUtcNow().UtcDateTime;
        var item = new PersonalCalendarEventModel { EventId = Guid.NewGuid().ToString(), OwnerId = owner, CreatedAt = now, UpdatedAt = now };
        Apply(item, request, start, end);
        db.PersonalCalendarEvent.Add(item);
        await db.SaveChangesAsync(ct);
        return Ok(ToResponse(item, item.StartDate));
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
        return Ok(ToResponse(item, item.StartDate));
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
        int RepeatDays, DateOnly? RepeatUntil, DateOnly SeriesStartDate, DateOnly SeriesEndDate);

    private static CalendarResponse ToResponse(PersonalCalendarEventModel item, DateOnly start) => new(
        item.EventId, item.Title, start, start.AddDays(item.EndDate.DayNumber - item.StartDate.DayNumber), item.StartTime, item.EndTime,
        item.AllDay, item.Category, item.Location, item.Notes, item.Version, item.CreatedAt, item.UpdatedAt,
        item.RepeatDays, item.RepeatUntil, item.StartDate, item.EndDate);

    private static IEnumerable<CalendarResponse> Occurrences(PersonalCalendarEventModel item, DateOnly from, DateOnly to)
    {
        if (item.RepeatDays == 0) { yield return ToResponse(item, item.StartDate); yield break; }
        var duration = item.EndDate.DayNumber - item.StartDate.DayNumber;
        var first = Math.Max(item.StartDate.DayNumber, from.DayNumber - duration);
        var last = Math.Min(to.DayNumber, item.RepeatUntil?.DayNumber ?? DateOnly.MaxValue.DayNumber - duration);
        last = Math.Min(last, DateOnly.MaxValue.DayNumber - duration);
        for (var n = first; n <= last; n++)
        {
            var date = DateOnly.FromDayNumber(n);
            if ((item.RepeatDays & (1 << (int)date.DayOfWeek)) != 0) yield return ToResponse(item, date);
        }
    }
}
