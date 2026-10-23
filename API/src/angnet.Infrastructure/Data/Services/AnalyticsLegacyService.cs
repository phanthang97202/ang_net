using System.Security.Cryptography;
using System.Text;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace angnet.Infrastructure.Data.Services;

// Source tables are archives after migration 0063. Preview reads only the ledger.
// Redis is available solely for an explicit, one-time recovery import, never a report/worker.
public sealed class AnalyticsLegacyService(AppDbContext db, Func<ILegacyVisitReader> legacy, TimeProvider clock,
    IMemoryCache cache, ILogger<AnalyticsLegacyService> logger)
{
    public async Task<bool> CaptureWebsite(CancellationToken ct = default)
    {
        if (await db.AnalyticsLedger.AnyAsync(x => x.Source == "Redis.VisitStats" && x.Period == "", ct)) return true;
        List<AnalyticsLegacyValueDto> values;
        try { values = await legacy().Read(ct); }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning("Historical recovery unavailable ({Type}); canonical statistics unaffected", ex.GetType().Name);
            return false;
        }
        // Empty/partial responses are NOT marked as a successful total import.
        if (!values.Any(x => x.Period == "") || values.Any(x => x.Value < 0)) return false;
        var now = clock.GetUtcNow().UtcDateTime;
        await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(ct);
            var state = await db.AnalyticsCollection.AsNoTracking().SingleAsync(ct);
            var prior = await db.AnalyticsLedger.LongCountAsync(x => x.Kind == "session" && x.RecordType == "event" && x.OccurredAt < now, ct);
            var canMerge = state.UnifiedAt.HasValue && !await db.WebsiteSession.AnyAsync(x => x.StartedAt >= state.UnifiedAt, ct);
            foreach (var value in values)
            {
                var key = "website:" + (value.Period == "" ? "total" : value.Period);
                var included = value.Period == "" && canMerge && value.Value >= prior;
                await AnalyticsLedgerStore.Insert(db, new AnalyticsLedgerModel
                {
                    EventId = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(key))),
                    Kind = "session", RecordType = "balance", Quantity = included ? value.Value - prior : value.Value,
                    OriginalValue = value.Value, Included = included, Period = value.Period, OccurredAt = now,
                    Source = "Redis.VisitStats", SourceId = key,
                    Note = value.Period != "" ? "UTC-month aggregate; excluded from Vietnam date reporting"
                        : included ? "Inherited tab-based total; excluded from date charts" : "Unknown overlap; preserved separately",
                }, ct);
            }
            await db.AnalyticsCollection.Where(x => x.Id == 1).ExecuteUpdateAsync(s => s.SetProperty(x => x.LegacyCapturedAt, now), ct);
            await tx.CommitAsync(ct);
        });
        return true;
    }

    public async Task<AnalyticsReconciliationDto> Preview(CancellationToken ct = default)
    {
        var state = await db.AnalyticsCollection.AsNoTracking().SingleAsync(ct);
        var balances = await db.AnalyticsLedger.AsNoTracking().Where(x => x.RecordType == "balance").ToListAsync(ct);
        var website = balances.Where(x => x.Source == "Redis.VisitStats").ToList();
        var imported = website.Any(x => x.Period == "");
        var result = new AnalyticsReconciliationDto
        {
            GeneratedAt = clock.GetUtcNow().UtcDateTime, AnalyticsStartedAt = state.StartedAt,
            UnifiedAt = state.CanonicalAt, LegacyCapturedAt = website.Where(x => x.Period == "").Select(x => (DateTime?)x.OccurredAt).FirstOrDefault(),
            MovieImportedAt = state.MovieImportedAt,
            ExistingMovieRows = await db.AnalyticsLedger.LongCountAsync(x => x.Kind == "movie" && x.RecordType == "event" && x.Included, ct),
            AuditBeforeAnalytics = await db.AnalyticsLedger.LongCountAsync(x => x.Source == "audit-legacy" && x.RecordType == "event", ct),
            AuditOverlappingAnalytics = await db.AnalyticsLedger.LongCountAsync(x => x.Source == "audit-legacy" && x.RecordType == "excluded" && x.OccurredAt >= state.StartedAt, ct),
            UnrecognisedAuditRows = await db.AnalyticsLedger.LongCountAsync(x => x.Source == "audit-legacy" && x.RecordType == "excluded" && x.ContentId == "", ct),
            ArticleCounterSnapshot = balances.Where(x => x.Kind == "article").Sum(x => x.OriginalValue ?? 0),
            ReelCounterSnapshot = balances.Where(x => x.Kind == "reel").Sum(x => x.OriginalValue ?? 0),
            RedisSnapshotExists = imported, RedisAvailable = imported,
            RedisError = imported ? "" : "Chưa có số tổng lịch sử. Chỉ thao tác nhập phục hồi mới đọc nguồn Redis lưu trữ; báo cáo không phụ thuộc nguồn này.",
            WebsiteValues = website.OrderBy(x => x.Period).Select(x => new AnalyticsLegacyValueDto { Period = x.Period, Value = x.OriginalValue ?? x.Quantity }).ToList(),
            PendingBalances = balances.Count(x => !x.Included && x.Period == ""),
            BalanceConflicts = balances.Where(x => !x.Included && x.Period == "").OrderBy(x => x.EventId).Take(100)
                .Select(x => new AnalyticsBalanceConflictDto { Kind = x.Kind, ContentId = x.ContentId, Title = x.Title,
                    Source = x.Source, OriginalValue = x.OriginalValue, Quantity = x.Quantity,
                    Reason = x.Kind == "session" ? "Chưa chứng minh được phần chồng lấn với phiên đã ghi nhận"
                        : x.OriginalValue == null ? "Nguồn cũ chưa lưu bộ đếm" : "Bộ đếm cũ thấp hơn sự kiện đã lưu; cần đối soát" }).ToList(),
        };
        result.PlanToken = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(
            $"{state.CanonicalAt?.Ticks}|" + string.Join(";", balances.OrderBy(x => x.EventId).Select(x => $"{x.EventId}:{x.Quantity}:{x.Included}")))));
        return result;
    }

    public async Task<AnalyticsReconciliationDto> Import(string reviewedToken, CancellationToken ct)
    {
        var plan = await Preview(ct);
        if (!CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(plan.PlanToken), Encoding.ASCII.GetBytes(reviewedToken)))
            throw new InvalidOperationException("Bản đối soát đã thay đổi. Hãy tải lại trước khi nhập.");
        if (!plan.RedisSnapshotExists && !await CaptureWebsite(ct))
            throw new InvalidOperationException("Chưa phục hồi được số tổng lịch sử. Không đánh dấu nhập thành công; nguồn chuẩn vẫn hoạt động.");
        return await Preview(ct);
    }

    public async Task Maintain(CancellationToken ct)
    {
        var expired = clock.GetUtcNow().UtcDateTime.AddMinutes(-30);
        await db.WebsiteSession.Where(x => x.IsCurrent && x.LastActivityAt <= expired)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsCurrent, false), ct);
    }
}
