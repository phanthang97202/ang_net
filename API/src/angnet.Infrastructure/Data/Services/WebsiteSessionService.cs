using angnet.Domain.Models;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace angnet.Infrastructure.Data.Services;

public sealed class WebsiteSessionService(AppDbContext db, TimeProvider clock)
{
    // Must be called within the caller's write transaction/execution strategy.
    public async Task<string?> Resolve(string requestedSession, string? visitorId, bool active, CancellationToken ct)
    {
        if (!Guid.TryParse(requestedSession, out _)) return null;
        var visitor = Guid.TryParseExact(visitorId, "D", out var browser)
            ? browser.ToString() : "v1:" + requestedSession.ToLowerInvariant();
        var now = clock.GetUtcNow().UtcDateTime;
        var expired = now.AddMinutes(-30);
        await db.WebsiteSession.Where(x => x.VisitorId == visitor && x.IsCurrent && x.LastActivityAt <= expired)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsCurrent, false), ct);
        var row = await db.WebsiteSession.AsNoTracking().SingleOrDefaultAsync(x => x.VisitorId == visitor && x.IsCurrent, ct);
        if (row == null && !active) return null;
        if (row == null)
        {
            var id = Guid.NewGuid().ToString();
            var source = visitor.StartsWith("v1:") ? "v1" : "web";
            var hour = now.AddHours(7).ToString("yyyy-MM-ddTHH", CultureInfo.InvariantCulture);
            // The filtered unique index chooses one current session across tabs and API instances.
            await db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "WebsiteSession" ("SessionId", "VisitorId", "StartedAt", "StartedLocalHour", "LastSeenAt", "LastActivityAt", "IsCurrent", "Source")
                VALUES ({id}, {visitor}, {now}, {hour}, {now}, {now}, true, {source})
                ON CONFLICT ("VisitorId") WHERE "IsCurrent" DO NOTHING
                """, ct);
            row = await db.WebsiteSession.AsNoTracking().SingleAsync(x => x.VisitorId == visitor && x.IsCurrent, ct);
        }
        var current = row.SessionId;
        if (active)
            await db.WebsiteSession.Where(x => x.SessionId == current).ExecuteUpdateAsync(s => s
                .SetProperty(x => x.LastSeenAt, now).SetProperty(x => x.LastActivityAt, now), ct);
        else
            await db.WebsiteSession.Where(x => x.SessionId == current).ExecuteUpdateAsync(s => s.SetProperty(x => x.LastSeenAt, now), ct);
        return current;
    }
}
