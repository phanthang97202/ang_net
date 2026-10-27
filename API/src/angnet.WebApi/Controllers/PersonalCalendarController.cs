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
        var items = await db.PersonalCalendarEvent.AsNoTracking().Where(x => x.OwnerId == owner && x.StartDate <= end && x.EndDate >= start)
            .OrderBy(x => x.StartDate).ThenBy(x => x.StartTime).ThenBy(x => x.EventId).ToListAsync(ct);
        return Ok(items.Select(ToResponse));
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
        return Ok(ToResponse(item));
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
        return Ok(ToResponse(item));
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
            r.Category is "personal" or "leisure" or "routine" or "work" &&
            (r.Location?.Length ?? 0) <= 200 && (r.Notes?.Length ?? 0) <= 1000 &&
            (r.AllDay || Time(r.StartTime) && Time(r.EndTime) && (start < end || string.CompareOrdinal(r.StartTime, r.EndTime) < 0));
    }
    private static void Apply(PersonalCalendarEventModel item, PersonalCalendarEventRequest r, DateOnly start, DateOnly end)
    {
        item.Title = r.Title.Trim(); item.StartDate = start; item.EndDate = end;
        item.StartTime = r.AllDay ? "" : r.StartTime; item.EndTime = r.AllDay ? "" : r.EndTime;
        item.AllDay = r.AllDay; item.Category = r.Category; item.Location = (r.Location ?? "").Trim(); item.Notes = (r.Notes ?? "").Trim();
    }
    private static object ToResponse(PersonalCalendarEventModel item) => new {
        item.EventId, item.Title, item.StartDate, item.EndDate, item.StartTime, item.EndTime,
        item.AllDay, item.Category, item.Location, item.Notes, item.Version, item.CreatedAt, item.UpdatedAt
    };
}
