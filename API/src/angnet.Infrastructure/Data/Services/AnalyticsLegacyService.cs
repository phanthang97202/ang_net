using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace angnet.Infrastructure.Data.Services;

public sealed class AnalyticsLegacyService(AppDbContext db, ILegacyVisitReader legacy, TimeProvider clock,
    IMemoryCache cache, ILogger<AnalyticsLegacyService> logger)
{
    public async Task<bool> CaptureWebsite(CancellationToken ct = default)
    {
        var state = await db.AnalyticsCollection.AsNoTracking().SingleAsync(x => x.Id == 1, ct);
        if (state.LegacyCapturedAt.HasValue) return true;
        List<AnalyticsLegacyValueDto> values;
        try { values = await legacy.Read(ct); }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning("Legacy visit counters could not be captured ({ErrorType}); DB analytics continues independently", ex.GetType().Name);
            return false;
        }
        var now = clock.GetUtcNow().UtcDateTime;
        // A late capture cannot prove which of the new DB visits were included in
        // the old counter. Keep it separately instead of silently adding overlaps.
        var merge = state.UnifiedAt.HasValue && !await db.WebsiteSession.AnyAsync(x => x.StartedAt >= state.UnifiedAt, ct);
        await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(ct);
            var claimed = await db.AnalyticsCollection.Where(x => x.Id == 1 && x.LegacyCapturedAt == null)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.LegacyCapturedAt, now), ct);
            if (claimed != 0)
                foreach (var value in values)
                {
                    var id = "website:" + (value.Period == "" ? "total" : value.Period);
                    await db.Database.ExecuteSqlInterpolatedAsync($"""
                        INSERT INTO "AnalyticsLegacySnapshot" ("SnapshotId", "Kind", "ContentId", "Title", "Source", "Period", "Value", "CapturedAt", "CanMerge")
                        VALUES ({id}, 'website', '', '', 'Redis.VisitStats', {value.Period}, {value.Value}, {now}, {merge})
                        ON CONFLICT ("SnapshotId") DO NOTHING
                        """, ct);
                }
            await tx.CommitAsync(ct);
        });
        cache.Remove(WebAnalyticsService.SummaryCache);
        return true;
    }

    private IQueryable<AuditTrailModel> MovieAudits() => db.AuditTrail.AsNoTracking().Where(x =>
        x.RecordId.StartsWith("phimapi:") && x.RequestUrl.EndsWith("/playback") && x.Description.StartsWith("Mở xem phim "));

    public async Task<AnalyticsReconciliationDto> Preview(CancellationToken ct = default)
    {
        var state = await db.AnalyticsCollection.AsNoTracking().SingleAsync(x => x.Id == 1, ct);
        var before = await MovieAudits().LongCountAsync(x => x.ChangedDTime < state.StartedAt, ct);
        var overlap = await MovieAudits().LongCountAsync(x => x.ChangedDTime >= state.StartedAt, ct);
        var result = new AnalyticsReconciliationDto
        {
            GeneratedAt = clock.GetUtcNow().UtcDateTime, AnalyticsStartedAt = state.StartedAt,
            UnifiedAt = state.UnifiedAt, LegacyCapturedAt = state.LegacyCapturedAt, MovieImportedAt = state.MovieImportedAt,
            ExistingMovieRows = await db.MovieViewLog.LongCountAsync(ct), AuditBeforeAnalytics = before,
            AuditOverlappingAnalytics = overlap,
            UnrecognisedAuditRows = await db.AuditTrail.LongCountAsync(x => x.RequestUrl.Contains("/Library/") && x.RequestUrl.EndsWith("/playback")
                && !(x.RecordId.StartsWith("phimapi:") && x.Description.StartsWith("Mở xem phim ")), ct),
            ArticleCounterSnapshot = await db.AnalyticsLegacySnapshot.Where(x => x.Kind == "article").Select(x => x.Value).SumAsync(ct),
            ReelCounterSnapshot = await db.AnalyticsLegacySnapshot.Where(x => x.Kind == "reel").Select(x => x.Value).SumAsync(ct),
            RedisSnapshotExists = state.LegacyCapturedAt.HasValue,
        };
        if (state.LegacyCapturedAt.HasValue)
        {
            result.RedisAvailable = true;
            result.WebsiteValues = await db.AnalyticsLegacySnapshot.Where(x => x.Kind == "website").OrderBy(x => x.Period)
                .Select(x => new AnalyticsLegacyValueDto { Period = x.Period, Value = x.Value }).ToListAsync(ct);
        }
        else
        {
            try { result.WebsiteValues = await legacy.Read(ct); result.RedisAvailable = true; }
            catch (Exception ex) when (ex is not OperationCanceledException) { result.RedisError = "Chưa đọc được nguồn Redis cũ. Thống kê DB vẫn hoạt động."; }
        }
        // Any changed source/boundary invalidates the reviewed import plan.
        result.PlanToken = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(
            $"{state.StartedAt.Ticks}|{state.UnifiedAt?.Ticks}|{state.LegacyCapturedAt?.Ticks}|{state.MovieImportedAt?.Ticks}|{before}|{overlap}|"
            + string.Join(";", result.WebsiteValues.OrderBy(x => x.Period).Select(x => $"{x.Period}:{x.Value}")))));
        return result;
    }

    public async Task<AnalyticsReconciliationDto> Import(string reviewedToken, CancellationToken ct)
    {
        var plan = await Preview(ct);
        if (!CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(plan.PlanToken), Encoding.ASCII.GetBytes(reviewedToken)))
            throw new InvalidOperationException("Nguồn dữ liệu đã thay đổi. Hãy tải lại bảng đối soát trước khi nhập.");
        // Review includes the Redis source; capture it only if it is readable.
        if (!plan.RedisSnapshotExists && plan.RedisAvailable) await CaptureWebsite(ct);
        var boundary = plan.AnalyticsStartedAt!.Value;
        var cursor = 0;
        while (true)
        {
            var batch = await MovieAudits().Where(x => x.ChangedDTime < boundary && x.AuditTrailId > cursor)
                .OrderBy(x => x.AuditTrailId).Take(250).ToListAsync(ct);
            if (batch.Count == 0) break;
            await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
            {
                await using var tx = await db.Database.BeginTransactionAsync(ct);
                foreach (var row in batch)
                {
                    var movie = Parse(row);
                    if (movie == null) continue; // Original row remains inspectable; never invent a missing film identity.
                    await db.Database.ExecuteSqlInterpolatedAsync($"""
                        INSERT INTO "MovieViewLog" ("EventId", "OccurredAt", "LocalHour", "UserId", "ActorName", "MovieSlug", "MovieTitle",
                            "ServerId", "ServerName", "EpisodeSlug", "EpisodeName", "Source", "LegacyAuditTrailId")
                        VALUES ({movie.EventId}, {movie.OccurredAt}, {movie.LocalHour}, {movie.UserId}, {movie.ActorName}, {movie.MovieSlug}, {movie.MovieTitle},
                            {movie.ServerId}, {movie.ServerName}, {movie.EpisodeSlug}, {movie.EpisodeName}, 'audit-legacy', {row.AuditTrailId})
                        ON CONFLICT DO NOTHING
                        """, ct);
                }
                await tx.CommitAsync(ct);
            });
            cursor = batch[^1].AuditTrailId;
        }
        var now = clock.GetUtcNow().UtcDateTime;
        var first = await db.MovieViewLog.Select(x => (DateTime?)x.OccurredAt).MinAsync(ct);
        await db.AnalyticsCollection.Where(x => x.Id == 1).ExecuteUpdateAsync(s => s
            .SetProperty(x => x.MovieImportedAt, now).SetProperty(x => x.MovieHistoryStartedAt, first ?? boundary), ct);
        cache.Remove(WebAnalyticsService.SummaryCache);
        return await Preview(ct);
    }

    internal static MovieViewLogModel? Parse(AuditTrailModel row)
    {
        var slug = row.RecordId["phimapi:".Length..];
        if (!Regex.IsMatch(slug, "^[A-Za-z0-9_-]{1,200}$")) return null;
        var result = new MovieViewLogModel
        {
            EventId = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes("legacy-audit:" + row.AuditTrailId))),
            OccurredAt = DateTime.SpecifyKind(row.ChangedDTime, DateTimeKind.Utc),
            LocalHour = row.ChangedDTime.AddHours(7).ToString("yyyy-MM-ddTHH", CultureInfo.InvariantCulture),
            MovieSlug = slug, MovieTitle = slug, ActorName = row.ChangedBy.Length > 256 ? row.ChangedBy[..256] : row.ChangedBy,
            LegacyAuditTrailId = row.AuditTrailId, Source = "audit-legacy",
        };
        var match = Regex.Match(row.Description, "^Mở xem phim \\\"(?<title>.*)\\\" \\(" + Regex.Escape(slug)
            + "\\) · Tập: (?<episode>.*?) \\((?<episodeId>[A-Za-z0-9_-]+)\\) · Nguồn: (?<server>.*?) \\((?<serverId>[0-9]+)\\) · UserId: (?<user>[A-Za-z0-9_-]+)$");
        if (match.Success)
        {
            static string Trim(string s, int max) => s.Length > max ? s[..max] : s;
            result.MovieTitle = Trim(match.Groups["title"].Value, 500);
            result.EpisodeName = Trim(match.Groups["episode"].Value, 200);
            result.EpisodeSlug = Trim(match.Groups["episodeId"].Value, 200);
            result.ServerName = Trim(match.Groups["server"].Value, 200);
            result.ServerId = int.TryParse(match.Groups["serverId"].Value, out var server) ? server : null;
            result.UserId = Trim(match.Groups["user"].Value, 450);
        }
        return result;
    }

    public async Task Maintain(CancellationToken ct)
    {
        var expired = clock.GetUtcNow().UtcDateTime.AddMinutes(-30);
        await db.WebsiteSession.Where(x => x.IsCurrent && x.LastActivityAt <= expired)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsCurrent, false), ct);
        var stale = clock.GetUtcNow().UtcDateTime.AddDays(-1);
        await db.AnalyticsPresence.Where(x => x.LastSeenAt < stale).ExecuteDeleteAsync(ct);
        // Preserve any v1 requests which completed during a rolling deployment.
        await db.Database.ExecuteSqlRawAsync("""
            INSERT INTO "MovieViewLog" ("EventId", "OccurredAt", "LocalHour", "SessionId", "ActorName", "MovieSlug", "MovieTitle", "Source")
            SELECT "EventId", "OccurredAt", "LocalHour", "SessionId", '', "ContentId", "Title", 'analytics-v1'
            FROM "AnalyticsEvent" a WHERE "Kind" = 'movie' AND NOT EXISTS (SELECT 1 FROM "MovieViewLog" m WHERE m."EventId" = a."EventId")
            ON CONFLICT DO NOTHING
            """, ct);
    }
}
