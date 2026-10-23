using angnet.Domain.Dtos;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using StackExchange.Redis;

namespace angnet.Infrastructure.Data.Services;

public interface ILegacyVisitReader
{
    Task<List<AnalyticsLegacyValueDto>> Read(CancellationToken ct);
}

// The only analytics component which reads Redis: one-time legacy capture/review.
// Normal tracking, footer and reporting never resolve this dependency.
public sealed class LegacyVisitReader(IConnectionMultiplexer redis, IWebHostEnvironment environment) : ILegacyVisitReader
{
    public async Task<List<AnalyticsLegacyValueDto>> Read(CancellationToken ct)
    {
        if (!redis.IsConnected) throw new InvalidOperationException("Redis legacy counters are unavailable");
        var suffix = environment.IsDevelopment() ? "dev" : "production";
        var keys = new HashSet<RedisKey> { "visit_total" + suffix };
        var database = redis.GetDatabase();
        foreach (var endpoint in redis.GetEndPoints())
        {
            var server = redis.GetServer(endpoint);
            if (!server.IsConnected || server.IsReplica) continue;
            await foreach (var key in server.KeysAsync(database.Database, "visit_month_*" + suffix, pageSize: 100).WithCancellation(ct))
            {
                keys.Add(key);
                if (keys.Count > 1201) throw new InvalidOperationException("Unexpected legacy counter key count");
            }
        }
        var ordered = keys.OrderBy(x => x.ToString(), StringComparer.Ordinal).ToArray();
        // Capture all discovered counters in a single Redis operation, without changing them.
        var values = (RedisResult[])(await database.ScriptEvaluateAsync(
            "local r = {}; for i,k in ipairs(KEYS) do r[i] = redis.call('GET',k) or false end; return r", ordered).WaitAsync(ct))!;
        var result = new List<AnalyticsLegacyValueDto>();
        for (var i = 0; i < ordered.Length; i++)
        {
            if (values[i].IsNull) continue;
            if (!long.TryParse(values[i].ToString(), out var count) || count < 0) throw new InvalidOperationException("Invalid legacy counter value");
            var key = ordered[i].ToString();
            var period = key.StartsWith("visit_month_") ? key[12..^suffix.Length] : "";
            if (period.Length != 0 && (period.Length != 6 || !DateOnly.TryParseExact(period + "01", "yyyyMMdd", out _))) continue;
            result.Add(new() { Period = period.Length == 6 ? period[..4] + "-" + period[4..] : "", Value = count });
        }
        return result;
    }
}
