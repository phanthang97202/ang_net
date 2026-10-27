using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Security.Claims;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using angnet.Domain.Enums;
using angnet.Infrastructure.Data;
using angnet.WebApi.Filters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace angnet.WebApi.Controllers;

public class MusicEventRequest
{
    [Required, MaxLength(20)] public string Kind { get; set; } = "";
    [Required, MaxLength(10)] public string Provider { get; set; } = "";
    [MaxLength(200)] public string TrackId { get; set; } = "";
    [MaxLength(500)] public string Title { get; set; } = "";
    [MaxLength(200)] public string Keyword { get; set; } = "";
    [MaxLength(36)] public string CollectionId { get; set; } = "";
}

[ApiController, Route("api/MusicAnalytics")]
public class MusicAnalyticsController(AppDbContext db, TimeProvider clock) : ControllerBase
{
    [HttpPost("Track"), AllowAnonymous, EnableRateLimiting("AnalyticsTrack"), SkipLogging]
    public async Task<IActionResult> Track(MusicEventRequest data, CancellationToken ct)
    {
        if (data.Provider is not ("YouTube" or "Audius") ||
            data.Kind is not ("search" or "search_error" or "click" or "play" or "play_error") ||
            ((data.Kind is "search" or "search_error") && string.IsNullOrWhiteSpace(data.Keyword)) ||
            ((data.Kind is "click" or "play" or "play_error") && string.IsNullOrWhiteSpace(data.TrackId))) return BadRequest();
        var collectionId = (data.CollectionId ?? "").Trim();
        if (collectionId != "" && !await db.MusicCollection.AsNoTracking().AnyAsync(x => x.CollectionId == collectionId && x.Visibility == EArchiveVisibility.Public, ct)) collectionId = "";
        db.MusicAnalyticsEvent.Add(new MusicAnalyticsEventModel {
            EventId = Guid.NewGuid().ToString(), OccurredAt = clock.GetUtcNow().UtcDateTime,
            Kind = data.Kind, Provider = data.Provider,
            UserId = User.Identity?.IsAuthenticated == true ? User.FindFirstValue(ClaimTypes.NameIdentifier) : null,
            TrackId = (data.TrackId ?? "").Trim(), Title = (data.Title ?? "").Trim(),
            Keyword = (data.Keyword ?? "").Trim(), CollectionId = collectionId
        });
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("Report"), Authorize(Policy = "music.analytics.view"), EnableRateLimiting("API")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> Report(string from, string to, string? provider = null, string? collectionId = null, CancellationToken ct = default)
    {
        provider ??= "";
        collectionId ??= "";
        if (!DateOnly.TryParseExact(from, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var first) ||
            !DateOnly.TryParseExact(to, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var last) ||
            first > last || last.DayNumber - first.DayNumber >= 93 || last > DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime.AddHours(7)) ||
            provider is not ("" or "YouTube" or "Audius") || collectionId.Length > 36) return BadRequest();
        var begin = DateTime.SpecifyKind(first.ToDateTime(TimeOnly.MinValue).AddHours(-7), DateTimeKind.Utc);
        var end = DateTime.SpecifyKind(last.AddDays(1).ToDateTime(TimeOnly.MinValue).AddHours(-7), DateTimeKind.Utc);
        var events = db.MusicAnalyticsEvent.AsNoTracking().Where(x => x.OccurredAt >= begin && x.OccurredAt < end);
        if (provider != "") events = events.Where(x => x.Provider == provider);
        var collectionIds = await events.Where(x => x.CollectionId != "").Select(x => x.CollectionId).Distinct().Take(200).ToListAsync(ct);
        var collections = await db.MusicCollection.AsNoTracking().Where(x => collectionIds.Contains(x.CollectionId) && x.Visibility == EArchiveVisibility.Public)
            .Select(x => new { x.CollectionId, x.Name }).OrderBy(x => x.Name).ToListAsync(ct);
        if (collectionId != "" && !collections.Any(x => x.CollectionId == collectionId)) return BadRequest();
        if (collectionId != "") events = events.Where(x => x.CollectionId == collectionId);
        var counts = await events.GroupBy(x => x.Kind).Select(g => new { Kind = g.Key, Count = g.Count() }).ToListAsync(ct);
        var users = await events.Where(x => x.UserId != null).Select(x => x.UserId).Distinct().CountAsync(ct);
        var uniqueSongs = await events.Where(x => x.Kind == "play").Select(x => new { x.Provider, x.TrackId }).Distinct().CountAsync(ct);
        var songs = await events.Where(x => x.Kind == "click").GroupBy(x => new { x.Provider, x.TrackId })
            .Select(g => new { g.Key.Provider, g.Key.TrackId, Title = g.Max(x => x.Title), Count = g.Count() })
            .OrderByDescending(x => x.Count).Take(10).ToListAsync(ct);
        var keywords = await events.Where(x => x.Kind == "search").GroupBy(x => new { x.Provider, x.Keyword })
            .Select(g => new { g.Key.Provider, g.Key.Keyword, Count = g.Count() }).OrderByDescending(x => x.Count).Take(10).ToListAsync(ct);
        var days = await events.GroupBy(x => new { Day = x.OccurredAt.AddHours(7).Date, x.Kind })
            .Select(g => new { g.Key.Day, g.Key.Kind, Count = g.Count() }).OrderBy(x => x.Day).ToListAsync(ct);
        var recent = await events.OrderByDescending(x => x.OccurredAt).ThenByDescending(x => x.EventId)
            .Take(100).Select(x => new { x.EventId, x.OccurredAt, x.Kind, x.Provider, x.Title, x.Keyword, x.UserId }).ToListAsync(ct);
        var userIds = recent.Where(x => x.UserId != null).Select(x => x.UserId!).Distinct().ToList();
        var names = await db.Users.AsNoTracking().Where(x => userIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id, x => x.UserName ?? "", ct);
        return Ok(new ApiResponse<object>(new { Counts = counts, Users = users, UniqueSongs = uniqueSongs, Songs = songs, Keywords = keywords, Days = days, Collections = collections,
            Recent = recent.Select(x => new { x.EventId, x.OccurredAt, x.Kind, x.Provider, x.Title, x.Keyword, UserName = x.UserId == null ? null : names.GetValueOrDefault(x.UserId) ?? "Tài khoản không còn tồn tại" }) }));
    }
}
