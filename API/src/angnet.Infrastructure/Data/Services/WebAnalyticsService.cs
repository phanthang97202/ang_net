using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace angnet.Infrastructure.Data.Services;

public class WebAnalyticsService(AppDbContext db, TimeProvider clock, WebsiteSessionService sessions,
    AnalyticsWriter writer, AnalyticsWriteHealth health, IMemoryCache cache)
{
    public const string SummaryCache = "analytics:public-summary";
    public static bool ValidContext(string session, string navigation, string path) =>
        Guid.TryParseExact(session, "D", out _) && Guid.TryParseExact(navigation, "D", out _) && PublicPath(path);
    public static bool PublicPath(string path) => !string.IsNullOrEmpty(path) && path.Length <= 500
        && Regex.IsMatch(path, @"^/(?:|news(?:/[a-zA-Z0-9_\-%]+/[a-zA-Z0-9_\-%]+)?|phim(?:/[a-zA-Z0-9_-]+)?|reels|note|tools(?:/[a-zA-Z0-9_-]+)?|game/[a-zA-Z0-9_/-]+|archive/[a-zA-Z0-9_-]+)$");
    public static bool IsBot(string userAgent) => string.IsNullOrWhiteSpace(userAgent)
        || Regex.IsMatch(userAgent, "bot|crawler|spider|headless|preview|curl|wget", RegexOptions.IgnoreCase);

    public async Task<bool> Record(string session, string navigation, string kind, string contentId,
        string title, string path, string discriminator = "", string? visitorId = null)
    {
        if (!ValidContext(session, navigation, path) || contentId.Length > 200 || kind is not ("page" or "article" or "reel")) return false;
        var identity = Guid.TryParse(visitorId, out var browser) ? browser.ToString() : session.ToLowerInvariant();
        var id = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes($"{identity}|{navigation.ToLowerInvariant()}|{kind}|{contentId}|{discriminator}")));
        var now = clock.GetUtcNow().UtcDateTime;
        var hour = now.AddHours(7).ToString("yyyy-MM-ddTHH", CultureInfo.InvariantCulture);
        title = title.Length > 500 ? title[..500] : title;
        var saved = await writer.Write(async ct =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(ct);
            if (!await db.AnalyticsEvent.AnyAsync(x => x.EventId == id, ct))
            {
                var canonical = await sessions.Resolve(session, visitorId, true, ct);
                var inserted = await db.Database.ExecuteSqlInterpolatedAsync($"""
                    INSERT INTO "AnalyticsEvent" ("EventId", "OccurredAt", "LocalHour", "SessionId", "Kind", "ContentId", "Title", "Path")
                    VALUES ({id}, {now}, {hour}, {canonical}, {kind}, {contentId}, {title}, {path})
                    ON CONFLICT ("EventId") DO NOTHING
                    """, ct);
                // The event and its public counter are one transaction; retries do not increment twice.
                if (inserted > 0 && kind == "article")
                    await db.News.Where(x => x.NewsId == contentId).ExecuteUpdateAsync(s => s.SetProperty(x => x.ViewCount, x => x.ViewCount + 1), ct);
                if (inserted > 0 && kind == "reel")
                    await db.Reel.Where(x => x.ReelId == contentId).ExecuteUpdateAsync(s => s.SetProperty(x => x.ViewCount, x => x.ViewCount + 1), ct);
            }
            await tx.CommitAsync(ct);
        });
        if (saved) cache.Remove(SummaryCache);
        return saved;
    }

    public async Task<bool> Presence(string session, string? visitorId = null, bool active = false)
    {
        if (!Guid.TryParse(session, out _)) return false;
        var saved = await writer.Write(async ct =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(ct);
            await sessions.Resolve(session, visitorId, active, ct);
            await tx.CommitAsync(ct);
        });
        if (saved) cache.Remove(SummaryCache);
        return saved;
    }

    public Task<int> ArticleCounter(string id) => db.News.Where(x => x.NewsId == id).Select(x => x.ViewCount).FirstOrDefaultAsync();
    public Task<int> ReelCounter(string id) => db.Reel.Where(x => x.ReelId == id).Select(x => x.ViewCount).FirstOrDefaultAsync();

    public async Task<AnalyticsLifetimeDto> Lifetime(CancellationToken ct = default)
    {
        if (cache.TryGetValue<AnalyticsLifetimeDto>(SummaryCache, out var saved)) return saved!;
        var now = clock.GetUtcNow().UtcDateTime;
        var month = now.AddHours(7).ToString("yyyy-MM", CultureInfo.InvariantCulture);
        var monthStart = Utc(DateOnly.ParseExact(month + "-01", "yyyy-MM-dd"));
        var state = await db.AnalyticsCollection.AsNoTracking().FirstOrDefaultAsync(ct);
        var snapshots = await db.AnalyticsLegacySnapshot.AsNoTracking().Where(x => x.Kind == "website").ToListAsync(ct);
        var total = snapshots.SingleOrDefault(x => x.Period == "");
        var monthly = snapshots.SingleOrDefault(x => x.Period == month);
        var value = new AnalyticsLifetimeDto
        {
            TotalVisits = (total is { CanMerge: true } ? total.Value : 0)
                + await db.WebsiteSession.LongCountAsync(x => total == null || !total.CanMerge || x.StartedAt >= total.CapturedAt, ct),
            MonthVisits = (monthly is { CanMerge: true } ? monthly.Value : 0)
                + await db.WebsiteSession.LongCountAsync(x => x.StartedAt >= monthStart && (monthly == null || !monthly.CanMerge || x.StartedAt >= monthly.CapturedAt), ct),
            ArticleViews = await db.News.Select(x => (long)x.ViewCount).SumAsync(ct),
            ReelViews = await db.Reel.Select(x => (long)x.ViewCount).SumAsync(ct),
            MovieOpens = await Movies().LongCountAsync(ct),
            LegacyCapturedAt = state?.LegacyCapturedAt,
            LegacyWebsiteImported = state?.LegacyCapturedAt != null,
            LegacyWebsiteMerged = total?.CanMerge ?? false,
            LegacyWebsite = snapshots.OrderBy(x => x.Period).Select(x => new AnalyticsLegacyValueDto { Period = x.Period, Value = x.Value }).ToList(),
        };
        cache.Set(SummaryCache, value, TimeSpan.FromSeconds(15));
        return value;
    }

    public async Task<VisitStatsDto> PublicStats(CancellationToken ct = default)
    {
        var life = await Lifetime(ct);
        var now = clock.GetUtcNow().UtcDateTime;
        return new VisitStatsDto
        {
            OnlineCount = await db.WebsiteSession.CountAsync(x => x.IsCurrent && x.LastSeenAt >= now.AddSeconds(-90) && x.LastActivityAt > now.AddMinutes(-30), ct),
            TotalCount = life.TotalVisits, MonthCount = life.MonthVisits,
            LegacyImported = life.LegacyWebsiteImported, LegacyMerged = life.LegacyWebsiteMerged,
        };
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
        var state = await db.AnalyticsCollection.AsNoTracking().FirstOrDefaultAsync(ct);
        var stats = await PublicStats(ct);
        return new AnalyticsReportDto
        {
            From = from, To = to, PreviousFrom = first.AddDays(-days).ToString("yyyy-MM-dd"),
            PreviousTo = first.AddDays(-1).ToString("yyyy-MM-dd"), GeneratedAt = now,
            CollectionStartedAt = state?.StartedAt,
            PreviousPeriodComplete = state != null && state.StartedAt <= previousStart,
            Coverage = new() { ["Sessions"] = state?.StartedAt, ["Pages"] = state?.StartedAt,
                ["Articles"] = state?.StartedAt, ["Reels"] = state?.StartedAt, ["Movies"] = state?.MovieHistoryStartedAt ?? state?.StartedAt },
            Online = stats.OnlineCount, Lifetime = await Lifetime(ct),
            Current = await Counts(start, cutoff, ct), Previous = await Counts(previousStart, previousCutoff, ct),
            Points = await Series(first, last, cutoff, ct),
            PreviousPoints = await Series(first.AddDays(-days), last.AddDays(-days), previousCutoff, ct),
            TopArticles = await TopArticles(start, cutoff, ct), TopMovies = await TopMovies(start, cutoff, ct),
            WriteFailures = health.Failures, LastWriteFailureAt = health.LastFailureAt,
        };
    }

    private IQueryable<AnalyticsEventModel> Events(DateTime start, DateTime end) =>
        db.AnalyticsEvent.AsNoTracking().Where(x => x.OccurredAt >= start && x.OccurredAt < end && x.Kind != "movie");

    // Include any final v1 write from a rolling deployment until the maintenance
    // import copies it. The primary event ID makes the two sources disjoint.
    internal IQueryable<MovieFact> Movies() => db.MovieViewLog.AsNoTracking().Select(x => new MovieFact
        { EventId = x.EventId, OccurredAt = x.OccurredAt, LocalHour = x.LocalHour, SessionId = x.SessionId, MovieSlug = x.MovieSlug, Title = x.MovieTitle })
        .Concat(db.AnalyticsEvent.AsNoTracking().Where(x => x.Kind == "movie" && !db.MovieViewLog.Any(m => m.EventId == x.EventId))
            .Select(x => new MovieFact { EventId = x.EventId, OccurredAt = x.OccurredAt, LocalHour = x.LocalHour, SessionId = x.SessionId, MovieSlug = x.ContentId, Title = x.Title }));

    private async Task<AnalyticsCountsDto> Counts(DateTime start, DateTime end, CancellationToken ct)
    {
        var counts = await Events(start, end).GroupBy(x => x.Kind).Select(g => new { Kind = g.Key, Count = g.Count() }).ToListAsync(ct);
        return new()
        {
            // Count session starts, not the sum of distinct visitors per page/day.
            Sessions = await db.WebsiteSession.CountAsync(x => x.StartedAt >= start && x.StartedAt < end, ct),
            Pages = counts.FirstOrDefault(x => x.Kind == "page")?.Count ?? 0,
            Articles = counts.FirstOrDefault(x => x.Kind == "article")?.Count ?? 0,
            Movies = await Movies().CountAsync(x => x.OccurredAt >= start && x.OccurredAt < end, ct),
            Reels = counts.FirstOrDefault(x => x.Kind == "reel")?.Count ?? 0,
        };
    }

    private async Task<List<AnalyticsPointDto>> Series(DateOnly first, DateOnly last, DateTime cutoff, CancellationToken ct)
    {
        var hourly = first == last;
        var begin = Utc(first);
        var rows = await Events(begin, cutoff)
            .GroupBy(x => new { Bucket = hourly ? x.LocalHour : x.LocalHour.Substring(0, 10), x.Kind })
            .Select(g => new { g.Key.Bucket, g.Key.Kind, Count = g.Count() }).ToListAsync(ct);
        var visits = await db.WebsiteSession.Where(x => x.StartedAt >= begin && x.StartedAt < cutoff)
            .GroupBy(x => hourly ? x.StartedLocalHour : x.StartedLocalHour.Substring(0, 10))
            .Select(g => new { Bucket = g.Key, Count = g.Count() }).ToListAsync(ct);
        var films = await Movies().Where(x => x.OccurredAt >= begin && x.OccurredAt < cutoff)
            .GroupBy(x => hourly ? x.LocalHour : x.LocalHour.Substring(0, 10))
            .Select(g => new { Bucket = g.Key, Count = g.Count() }).ToListAsync(ct);
        var buckets = hourly ? Enumerable.Range(0, 24).Select(h => $"{first:yyyy-MM-dd}T{h:00}")
            : Enumerable.Range(0, last.DayNumber - first.DayNumber + 1).Select(d => first.AddDays(d).ToString("yyyy-MM-dd"));
        return buckets.Select(bucket => new AnalyticsPointDto
        {
            Bucket = bucket, Sessions = visits.FirstOrDefault(x => x.Bucket == bucket)?.Count ?? 0,
            Pages = rows.FirstOrDefault(x => x.Bucket == bucket && x.Kind == "page")?.Count ?? 0,
            Articles = rows.FirstOrDefault(x => x.Bucket == bucket && x.Kind == "article")?.Count ?? 0,
            Movies = films.FirstOrDefault(x => x.Bucket == bucket)?.Count ?? 0,
            Reels = rows.FirstOrDefault(x => x.Bucket == bucket && x.Kind == "reel")?.Count ?? 0,
        }).ToList();
    }

    private Task<List<AnalyticsTopDto>> TopArticles(DateTime start, DateTime end, CancellationToken ct) =>
        Events(start, end).Where(x => x.Kind == "article").GroupBy(x => x.ContentId)
            .Select(g => new AnalyticsTopDto { ContentId = g.Key, Title = g.Max(x => x.Title)!, Path = g.Max(x => x.Path)!,
                Views = g.Count(), Sessions = g.Select(x => x.SessionId).Distinct().Count() })
            .OrderByDescending(x => x.Views).ThenBy(x => x.ContentId).Take(10).ToListAsync(ct);

    private Task<List<AnalyticsTopDto>> TopMovies(DateTime start, DateTime end, CancellationToken ct) =>
        Movies().Where(x => x.OccurredAt >= start && x.OccurredAt < end).GroupBy(x => x.MovieSlug)
            .Select(g => new AnalyticsTopDto { ContentId = g.Key, Title = g.Max(x => x.Title)!, Path = "/phim/" + g.Key,
                Views = g.Count(), Sessions = g.Where(x => x.SessionId != null).Select(x => x.SessionId).Distinct().Count(),
                UnknownSessions = g.Count(x => x.SessionId == null) })
            .OrderByDescending(x => x.Views).ThenBy(x => x.ContentId).Take(10).ToListAsync(ct);

    private static DateTime Utc(DateOnly day) => DateTime.SpecifyKind(day.ToDateTime(TimeOnly.MinValue).AddHours(-7), DateTimeKind.Utc);

    internal class MovieFact
    {
        public string EventId { get; set; } = "";
        public DateTime OccurredAt { get; set; }
        public string LocalHour { get; set; } = "";
        public string? SessionId { get; set; }
        public string MovieSlug { get; set; } = "";
        public string Title { get; set; } = "";
    }
}
