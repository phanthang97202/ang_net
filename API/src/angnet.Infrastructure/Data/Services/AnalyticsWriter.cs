using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

namespace angnet.Infrastructure.Data.Services;

// Health remains available without writing another row into an unavailable DB.
public sealed class AnalyticsWriteHealth
{
    private readonly System.Collections.Concurrent.ConcurrentDictionary<string, DateTime> pending = new();
    private long failures;
    private long lastFailureTicks;
    public long Failures => Interlocked.Read(ref failures);
    public DateTime? LastFailureAt => Interlocked.Read(ref lastFailureTicks) is var ticks && ticks != 0 ? new DateTime(ticks, DateTimeKind.Utc) : null;
    public void Failed(DateTime now)
    {
        Interlocked.Increment(ref failures); Interlocked.Exchange(ref lastFailureTicks, now.Ticks);
        pending.TryAdd(Guid.NewGuid().ToString(), now.AddSeconds(-3));
    }
    internal KeyValuePair<string, DateTime>[] Pending() => pending.ToArray();
    internal void Recovered(string id) => pending.TryRemove(id, out _);
}

public sealed class AnalyticsWriter(AppDbContext db, TimeProvider clock, AnalyticsWriteHealth health, ILogger<AnalyticsWriter> logger)
{
    public async Task<bool> Write(Func<CancellationToken, Task> operation, CancellationToken request = default)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(request);
        timeout.CancelAfter(TimeSpan.FromSeconds(3));
        try
        {
            // Use the provider's transient retry policy, with a short overall budget.
            // All callers use stable IDs and transactions so a retry cannot add a second view.
            await db.Database.CreateExecutionStrategy().ExecuteAsync(0, async (_, _, ct) =>
            {
                await operation(ct);
                // Persist known outage windows once DB writes recover. Stable keys
                // survive an execution-strategy retry without duplicate warnings.
                foreach (var gap in health.Pending())
                {
                    var end = clock.GetUtcNow().UtcDateTime;
                    await db.Database.ExecuteSqlInterpolatedAsync($"""
                        INSERT INTO "AnalyticsGap" ("GapId","StartedAt","EndedAt","Failures")
                        VALUES ({gap.Key},{gap.Value},{end},1) ON CONFLICT DO NOTHING
                        """, ct);
                    health.Recovered(gap.Key);
                }
                return true;
            }, null, timeout.Token);
            return true;
        }
        catch (OperationCanceledException) when (request.IsCancellationRequested) { return false; }
        catch (Exception ex)
        {
            health.Failed(clock.GetUtcNow().UtcDateTime);
            logger.LogWarning(ex, "Analytics write failed; the same event ID can be retried safely");
            return false;
        }
    }
}
