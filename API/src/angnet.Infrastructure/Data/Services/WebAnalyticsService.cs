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
            if (!await db.AnalyticsLedger.AnyAsync(x => x.EventId == id, ct))
            {
                var canonical = await sessions.Resolve(session, visitorId, true, ct);
                await AnalyticsLedgerStore.Insert(db, new AnalyticsLedgerModel
                {
                    EventId = id, Kind = kind, OccurredAt = now, LocalHour = hour,
                    SessionId = canonical, ContentId = contentId, Title = title, Path = path,
                }, ct);
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

    public async Task<int> ArticleCounter(string id) => (int)Math.Min(int.MaxValue, await LedgerTotal("article", id));
    public async Task<int> ReelCounter(string id) => (int)Math.Min(int.MaxValue, await LedgerTotal("reel", id));
    private Task<long> LedgerTotal(string kind, string? content = null, CancellationToken ct = default) =>
        db.AnalyticsLedger.Where(x => x.Included && x.Period == "" && (x.RecordType == "event" || x.RecordType == "balance") && x.Kind == kind && (content == null || x.ContentId == content))
            .Select(x => x.Quantity).SumAsync(ct);

    private async Task<T> Snapshot<T>(Func<Task<T>> read, CancellationToken ct)
    {
        if (db.Database.CurrentTransaction != null) return await read();
        return await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable, ct);
            var value = await read();
            await tx.CommitAsync(ct);
            return value;
        });
    }

    public Task<AnalyticsLifetimeDto> Lifetime(CancellationToken ct = default) => Snapshot(() => LifetimeCore(ct), ct);
    private async Task<AnalyticsLifetimeDto> LifetimeCore(CancellationToken ct)
    {
        var now = clock.GetUtcNow().UtcDateTime;
        var month = now.AddHours(7).ToString("yyyy-MM", CultureInfo.InvariantCulture);
        var monthStart = Utc(DateOnly.ParseExact(month + "-01", "yyyy-MM-dd"));
        var state = await db.AnalyticsCollection.AsNoTracking().FirstOrDefaultAsync(ct);
        var snapshots = await db.AnalyticsLedger.AsNoTracking().Where(x => x.Kind == "session" && x.RecordType == "balance").ToListAsync(ct);
        var total = snapshots.SingleOrDefault(x => x.Period == "");
        var totals = await db.AnalyticsLedger.Where(x => x.Included && x.Period == "" && (x.RecordType == "event" || x.RecordType == "balance"))
            .GroupBy(x => x.Kind).Select(g => new { Kind = g.Key, Value = g.Sum(x => x.Quantity) }).ToListAsync(ct);
        long Sum(string kind) => totals.FirstOrDefault(x => x.Kind == kind)?.Value ?? 0;
        var value = new AnalyticsLifetimeDto
        {
            TotalVisits = Sum("session"),
            // Old UTC-month aggregates cannot be converted to Vietnam months.
            MonthVisits = await Events(monthStart, now.AddTicks(1)).Where(x => x.Kind == "session").Select(x => x.Quantity).SumAsync(ct),
            ArticleViews = Sum("article"),
            ReelViews = Sum("reel"),
            MovieOpens = Sum("movie"),
            LegacyCapturedAt = total?.OccurredAt,
            LegacyWebsiteImported = total != null,
            LegacyWebsiteMerged = total?.Included ?? false,
            LegacyWebsite = snapshots.OrderBy(x => x.Period).Select(x => new AnalyticsLegacyValueDto { Period = x.Period, Value = x.OriginalValue ?? x.Quantity }).ToList(),
            DetailedFrom = state?.StartedAt,
            PendingBalances = await db.AnalyticsLedger.CountAsync(x => x.RecordType == "balance" && !x.Included && x.Period == "", ct),
        };
        return value;
    }

    public Task<VisitStatsDto> PublicStats(CancellationToken ct = default) => Snapshot(() => PublicStatsCore(ct), ct);
    private async Task<VisitStatsDto> PublicStatsCore(CancellationToken ct)
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

    public Task<AnalyticsReportDto> Report(string from, string to, CancellationToken ct = default) =>
        db.Database.CreateExecutionStrategy().ExecuteAsync(() => ReportSnapshot(from, to, ct));

    private async Task<AnalyticsReportDto> ReportSnapshot(string from, string to, CancellationToken ct)
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
        // One consistent read snapshot for cards, series, rankings and lifetime.
        await using var snapshot = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable, ct);
        var state = await db.AnalyticsCollection.AsNoTracking().FirstOrDefaultAsync(ct);
        var stats = await PublicStats(ct);
        var result = new AnalyticsReportDto
        {
            From = from, To = to, PreviousFrom = first.AddDays(-days).ToString("yyyy-MM-dd"),
            PreviousTo = first.AddDays(-1).ToString("yyyy-MM-dd"), GeneratedAt = now,
            CollectionStartedAt = state?.StartedAt,
            PreviousPeriodComplete = state != null && state.StartedAt <= previousStart,
            Coverage = new() { ["Sessions"] = state?.UnifiedAt ?? state?.StartedAt, ["Pages"] = state?.StartedAt,
                ["Articles"] = state?.StartedAt, ["Reels"] = state?.StartedAt, ["Movies"] = state?.StartedAt },
            Online = stats.OnlineCount, Lifetime = await Lifetime(ct),
            Current = await Counts(start, cutoff, ct), Previous = await Counts(previousStart, previousCutoff, ct),
            Points = await Series(first, last, cutoff, ct),
            PreviousPoints = await Series(first.AddDays(-days), last.AddDays(-days), previousCutoff, ct),
            TopArticles = await TopArticles(start, cutoff, ct), TopMovies = await TopMovies(start, cutoff, ct),
            WriteFailures = await db.AnalyticsGap.Select(x => x.Failures).SumAsync(ct) + health.Pending().LongLength,
            LastWriteFailureAt = health.LastFailureAt ?? await db.AnalyticsGap.Select(x => (DateTime?)x.EndedAt).MaxAsync(ct),
        };
        var currentGap = await db.AnalyticsGap.AnyAsync(x => x.StartedAt < cutoff && x.EndedAt >= start, ct)
            || health.Pending().Any(x => x.Value < cutoff);
        var previousGap = await db.AnalyticsGap.AnyAsync(x => x.StartedAt < previousCutoff && x.EndedAt >= previousStart, ct);
        foreach (var (metric, began) in result.Coverage)
        {
            var currentStatus = began == null || began >= cutoff ? "unavailable" : began > start || currentGap ? "partial" : "complete";
            var previousStatus = began == null || began >= previousCutoff ? "unavailable" : began > previousStart || previousGap ? "partial" : "complete";
            if (currentStatus == "unavailable" && (int)typeof(AnalyticsCountsDto).GetProperty(metric)!.GetValue(result.Current)! > 0) currentStatus = "partial";
            if (previousStatus == "unavailable" && (int)typeof(AnalyticsCountsDto).GetProperty(metric)!.GetValue(result.Previous)! > 0) previousStatus = "partial";
            result.DataQuality[metric] = new AnalyticsQualityDto { Current = currentStatus, Previous = previousStatus,
                CanCompare = currentStatus == "complete" && previousStatus == "complete",
                Reason = currentGap || previousGap ? "Có gián đoạn ghi dữ liệu trong kỳ" : began == null ? "Chưa xác định mốc ghi nhận" : $"Dữ liệu liên tục từ {began.Value.AddHours(7):HH:mm dd/MM/yyyy}" };
        }
        await snapshot.CommitAsync(ct);
        return result;
    }

    private IQueryable<AnalyticsLedgerModel> Events(DateTime start, DateTime end) =>
        db.AnalyticsLedger.AsNoTracking().Where(x => x.RecordType == "event" && x.Included && x.OccurredAt >= start && x.OccurredAt < end);

    // The log endpoint and report use this same canonical subset, never a union.
    internal IQueryable<AnalyticsLedgerModel> Movies() => db.AnalyticsLedger.AsNoTracking().Where(x => x.Kind == "movie" && x.RecordType == "event" && x.Included);

    private async Task<AnalyticsCountsDto> Counts(DateTime start, DateTime end, CancellationToken ct)
    {
        var counts = await Events(start, end).GroupBy(x => x.Kind).Select(g => new { Kind = g.Key, Count = g.Count() }).ToListAsync(ct);
        return new()
        {
            // Count session starts, not the sum of distinct visitors per page/day.
            Sessions = counts.FirstOrDefault(x => x.Kind == "session")?.Count ?? 0,
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
        var gaps = await db.AnalyticsGap.AsNoTracking().Where(x => x.StartedAt < cutoff && x.EndedAt >= begin).ToListAsync(ct);
        gaps.AddRange(health.Pending().Select(x => new AnalyticsGapModel { StartedAt = x.Value, EndedAt = clock.GetUtcNow().UtcDateTime }));
        var rows = await Events(begin, cutoff)
            .GroupBy(x => new { Bucket = hourly ? x.LocalHour : x.LocalHour.Substring(0, 10), x.Kind })
            .Select(g => new { g.Key.Bucket, g.Key.Kind, Count = g.Count() }).ToListAsync(ct);
        var visits = await Events(begin, cutoff).Where(x => x.Kind == "session")
            .GroupBy(x => hourly ? x.LocalHour : x.LocalHour.Substring(0, 10))
            .Select(g => new { Bucket = g.Key, Count = g.Count() }).ToListAsync(ct);
        var films = await Movies().Where(x => x.OccurredAt >= begin && x.OccurredAt < cutoff)
            .GroupBy(x => hourly ? x.LocalHour : x.LocalHour.Substring(0, 10))
            .Select(g => new { Bucket = g.Key, Count = g.Count() }).ToListAsync(ct);
        var buckets = hourly ? Enumerable.Range(0, 24).Select(h => $"{first:yyyy-MM-dd}T{h:00}")
            : Enumerable.Range(0, last.DayNumber - first.DayNumber + 1).Select(d => first.AddDays(d).ToString("yyyy-MM-dd"));
        return buckets.Select(bucket => new AnalyticsPointDto
        {
            Bucket = bucket,
            HasGap = gaps.Any(x => x.StartedAt < DateTime.ParseExact(bucket, hourly ? "yyyy-MM-dd'T'HH" : "yyyy-MM-dd", CultureInfo.InvariantCulture).AddHours(-7).AddHours(hourly ? 1 : 24)
                && x.EndedAt >= DateTime.ParseExact(bucket, hourly ? "yyyy-MM-dd'T'HH" : "yyyy-MM-dd", CultureInfo.InvariantCulture).AddHours(-7)),
            Sessions = visits.FirstOrDefault(x => x.Bucket == bucket)?.Count ?? 0,
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
        Movies().Where(x => x.OccurredAt >= start && x.OccurredAt < end).GroupBy(x => x.ContentId)
            .Select(g => new AnalyticsTopDto { ContentId = g.Key, Title = g.Max(x => x.Title)!, Path = "/phim/" + g.Key,
                Views = g.Count(), Sessions = g.Where(x => x.SessionId != null).Select(x => x.SessionId).Distinct().Count(),
                UnknownSessions = g.Count(x => x.SessionId == null) })
            .OrderByDescending(x => x.Views).ThenBy(x => x.ContentId).Take(10).ToListAsync(ct);

    private static DateTime Utc(DateOnly day) => DateTime.SpecifyKind(day.ToDateTime(TimeOnly.MinValue).AddHours(-7), DateTimeKind.Utc);

}
