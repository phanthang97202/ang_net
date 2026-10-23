using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using angnet.Domain.Dtos;
using angnet.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace angnet.Infrastructure.Data.Services;

public class WebAnalyticsService(AppDbContext db, TimeProvider clock, ILogger<WebAnalyticsService> logger)
{
    public static bool ValidContext(string session, string navigation, string path) =>
        Guid.TryParseExact(session, "D", out _) && Guid.TryParseExact(navigation, "D", out _) && PublicPath(path);

    public static bool PublicPath(string path) => !string.IsNullOrEmpty(path) && path.Length <= 500
        && Regex.IsMatch(path, @"^/(?:|news(?:/[a-zA-Z0-9_\-%]+/[a-zA-Z0-9_\-%]+)?|phim(?:/[a-zA-Z0-9_-]+)?|reels|note|tools(?:/[a-zA-Z0-9_-]+)?|game/[a-zA-Z0-9_/-]+|archive/[a-zA-Z0-9_-]+)$");

    public static bool IsBot(string userAgent) => string.IsNullOrWhiteSpace(userAgent)
        || Regex.IsMatch(userAgent, "bot|crawler|spider|headless|preview|curl|wget", RegexOptions.IgnoreCase);

    // Writes are best effort and idempotent per navigation/content (including
    // episode/source for films). No IP, account name, token or playback URL is stored.
    public async Task Record(string session, string navigation, string kind, string contentId,
        string title, string path, string discriminator = "")
    {
        if (!ValidContext(session, navigation, path) || contentId.Length > 200
            || kind is not ("page" or "article" or "movie" or "reel")) return;
        var now = clock.GetUtcNow().UtcDateTime;
        var id = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(
            $"{session.ToLowerInvariant()}|{navigation.ToLowerInvariant()}|{kind}|{contentId}|{discriminator}")));
        var hour = now.AddHours(7).ToString("yyyy-MM-ddTHH", CultureInfo.InvariantCulture);
        title = title.Length > 500 ? title[..500] : title;
        try
        {
            await db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "AnalyticsEvent" ("EventId", "OccurredAt", "LocalHour", "SessionId", "Kind", "ContentId", "Title", "Path")
                VALUES ({id}, {now}, {hour}, {session.ToLowerInvariant()}, {kind}, {contentId}, {title}, {path})
                ON CONFLICT ("EventId") DO NOTHING
                """);
        }
        catch (Exception ex) { logger.LogWarning(ex, "Could not record web analytics event"); }
    }

    public async Task Presence(string session)
    {
        if (!Guid.TryParseExact(session, "D", out _)) return;
        var now = clock.GetUtcNow().UtcDateTime;
        try
        {
            await db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "AnalyticsPresence" ("SessionId", "LastSeenAt") VALUES ({session.ToLowerInvariant()}, {now})
                ON CONFLICT ("SessionId") DO UPDATE SET "LastSeenAt" = EXCLUDED."LastSeenAt"
                """);
            // Presence has no historical value; keep this small without a background job.
            await db.AnalyticsPresence.Where(x => x.LastSeenAt < now.AddDays(-1)).ExecuteDeleteAsync();
        }
        catch (Exception ex) { logger.LogWarning(ex, "Could not update analytics presence"); }
    }

    public async Task<AnalyticsReportDto> Report(string from, string to, CancellationToken ct = default)
    {
        var now = clock.GetUtcNow().UtcDateTime;
        var today = DateOnly.FromDateTime(now.AddHours(7));
        if (!DateOnly.TryParseExact(from, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var first)
            || !DateOnly.TryParseExact(to, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var last)
            || last < first || last > today || last.DayNumber - first.DayNumber >= 93)
            throw new ArgumentException("Chọn khoảng ngày hợp lệ, tối đa 93 ngày và không vượt quá hôm nay.");
        var days = last.DayNumber - first.DayNumber + 1;
        var start = Utc(first);
        var end = Utc(last.AddDays(1));
        var cutoff = end < now ? end : now;
        var previousStart = start.AddDays(-days);
        var previousCutoff = cutoff.AddDays(-days);
        var started = await db.AnalyticsCollection.Select(x => (DateTime?)x.StartedAt).FirstOrDefaultAsync(ct);
        var report = new AnalyticsReportDto
        {
            From = from, To = to, PreviousFrom = first.AddDays(-days).ToString("yyyy-MM-dd"),
            PreviousTo = first.AddDays(-1).ToString("yyyy-MM-dd"), GeneratedAt = now,
            CollectionStartedAt = started,
            PreviousPeriodComplete = started.HasValue && started <= previousStart,
            Online = await db.AnalyticsPresence.CountAsync(x => x.LastSeenAt >= now.AddSeconds(-90), ct),
            Current = await Counts(start, cutoff, ct), Previous = await Counts(previousStart, previousCutoff, ct),
            Points = await Series(first, last, cutoff, ct),
            PreviousPoints = await Series(first.AddDays(-days), last.AddDays(-days), previousCutoff, ct),
            TopArticles = await Top("article", start, cutoff, ct), TopMovies = await Top("movie", start, cutoff, ct),
        };
        return report;
    }

    private IQueryable<angnet.Domain.Models.AnalyticsEventModel> Events(DateTime start, DateTime end) =>
        db.AnalyticsEvent.AsNoTracking().Where(x => x.OccurredAt >= start && x.OccurredAt < end);

    private async Task<AnalyticsCountsDto> Counts(DateTime start, DateTime end, CancellationToken ct)
    {
        var counts = await Events(start, end).GroupBy(x => x.Kind)
            .Select(g => new { Kind = g.Key, Count = g.Count(), Sessions = g.Select(x => x.SessionId).Distinct().Count() }).ToListAsync(ct);
        return new()
        {
            Sessions = counts.FirstOrDefault(x => x.Kind == "page")?.Sessions ?? 0,
            Pages = counts.FirstOrDefault(x => x.Kind == "page")?.Count ?? 0,
            Articles = counts.FirstOrDefault(x => x.Kind == "article")?.Count ?? 0,
            Movies = counts.FirstOrDefault(x => x.Kind == "movie")?.Count ?? 0,
            Reels = counts.FirstOrDefault(x => x.Kind == "reel")?.Count ?? 0,
        };
    }

    private async Task<List<AnalyticsPointDto>> Series(DateOnly first, DateOnly last, DateTime cutoff, CancellationToken ct)
    {
        var hourly = first == last;
        var rows = await Events(Utc(first), cutoff)
            .GroupBy(x => new { Bucket = hourly ? x.LocalHour : x.LocalHour.Substring(0, 10), x.Kind })
            .Select(g => new { g.Key.Bucket, g.Key.Kind, Count = g.Count(), Sessions = g.Select(x => x.SessionId).Distinct().Count() }).ToListAsync(ct);
        var buckets = hourly ? Enumerable.Range(0, 24).Select(h => $"{first:yyyy-MM-dd}T{h:00}")
            : Enumerable.Range(0, last.DayNumber - first.DayNumber + 1).Select(d => first.AddDays(d).ToString("yyyy-MM-dd"));
        return buckets.Select(bucket => new AnalyticsPointDto
        {
            Bucket = bucket,
            Sessions = rows.FirstOrDefault(x => x.Bucket == bucket && x.Kind == "page")?.Sessions ?? 0,
            Pages = rows.FirstOrDefault(x => x.Bucket == bucket && x.Kind == "page")?.Count ?? 0,
            Articles = rows.FirstOrDefault(x => x.Bucket == bucket && x.Kind == "article")?.Count ?? 0,
            Movies = rows.FirstOrDefault(x => x.Bucket == bucket && x.Kind == "movie")?.Count ?? 0,
            Reels = rows.FirstOrDefault(x => x.Bucket == bucket && x.Kind == "reel")?.Count ?? 0,
        }).ToList();
    }

    private Task<List<AnalyticsTopDto>> Top(string kind, DateTime start, DateTime end, CancellationToken ct) =>
        Events(start, end).Where(x => x.Kind == kind).GroupBy(x => x.ContentId)
            .Select(g => new AnalyticsTopDto { ContentId = g.Key, Title = g.Max(x => x.Title)!, Path = g.Max(x => x.Path)!,
                Views = g.Count(), Sessions = g.Select(x => x.SessionId).Distinct().Count() })
            .OrderByDescending(x => x.Views).ThenBy(x => x.ContentId).Take(10).ToListAsync(ct);

    private static DateTime Utc(DateOnly day) => DateTime.SpecifyKind(day.ToDateTime(TimeOnly.MinValue).AddHours(-7), DateTimeKind.Utc);
}
