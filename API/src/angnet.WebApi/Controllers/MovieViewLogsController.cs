using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using angnet.Domain.Dtos;
using angnet.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace angnet.WebApi.Controllers;

[ApiController, Route("api/MovieViewLogs"), Authorize(Policy = "movieviewlog.view"), EnableRateLimiting("API")]
public class MovieViewLogsController(AppDbContext db, TimeProvider clock) : ControllerBase
{
    [HttpGet, ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> Search(string from, string to, string keyword = "", int pageSize = 30, string? cursor = null, CancellationToken ct = default)
    {
        if (!DateOnly.TryParseExact(from, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var first)
            || !DateOnly.TryParseExact(to, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var last)
            || first > last || last.DayNumber - first.DayNumber >= 93
            || last > DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime.AddHours(7)) || keyword.Length > 200 || pageSize is < 1 or > 100)
            return BadRequest();
        var begin = DateTime.SpecifyKind(first.ToDateTime(TimeOnly.MinValue).AddHours(-7), DateTimeKind.Utc);
        var end = DateTime.SpecifyKind(last.AddDays(1).ToDateTime(TimeOnly.MinValue).AddHours(-7), DateTimeKind.Utc);
        var query = db.MovieViewLog.AsNoTracking().Where(x => x.OccurredAt >= begin && x.OccurredAt < end);
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var term = keyword.Trim().ToLowerInvariant();
            query = query.Where(x => x.MovieTitle.ToLower().Contains(term) || x.MovieSlug.ToLower().Contains(term)
                || x.ActorName.ToLower().Contains(term) || x.UserId != null && x.UserId.ToLower().Contains(term));
        }
        if (!string.IsNullOrEmpty(cursor))
        {
            try
            {
                var parts = Encoding.UTF8.GetString(Convert.FromBase64String(cursor)).Split(':');
                if (parts.Length != 2 || !long.TryParse(parts[0], out var ticks) || !Regex.IsMatch(parts[1], "^[A-F0-9]{64}$")) return BadRequest();
                var time = new DateTime(ticks, DateTimeKind.Utc);
                var id = parts[1];
                query = query.Where(x => x.OccurredAt < time || x.OccurredAt == time && string.Compare(x.EventId, id) < 0);
            }
            catch (Exception ex) when (ex is FormatException or ArgumentException) { return BadRequest(); }
        }
        var rows = await query.OrderByDescending(x => x.OccurredAt).ThenByDescending(x => x.EventId).Take(pageSize + 1).ToListAsync(ct);
        var more = rows.Count > pageSize;
        var visible = rows.Take(pageSize).ToList();
        var tail = visible.LastOrDefault();
        return Ok(new ApiResponse<MovieViewLogPageDto>(new MovieViewLogPageDto
        {
            Items = visible.Select(x => new MovieViewLogDto
            {
                EventId = x.EventId, OccurredAt = x.OccurredAt, UserId = x.UserId, ActorName = x.ActorName,
                MovieSlug = x.MovieSlug, MovieTitle = x.MovieTitle, ServerId = x.ServerId,
                ServerName = x.ServerName, EpisodeSlug = x.EpisodeSlug, EpisodeName = x.EpisodeName, Source = x.Source,
            }).ToList(),
            NextCursor = more && tail != null ? Convert.ToBase64String(Encoding.UTF8.GetBytes($"{tail.OccurredAt.Ticks}:{tail.EventId}")) : null,
        }));
    }
}
