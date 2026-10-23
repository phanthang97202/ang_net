using angnet.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace angnet.Infrastructure.Data.Services;

internal static class AnalyticsLedgerStore
{
    internal static async Task<int> Insert(AppDbContext db, AnalyticsLedgerModel x, CancellationToken ct)
    {
        var inserted = await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "AnalyticsLedger" ("EventId","Kind","RecordType","Quantity","OriginalValue","Included","OccurredAt","LocalHour","Period","SessionId","ContentId","Title","Path","Source","SourceId","Note","UserId","ActorName","ServerId","ServerName","EpisodeSlug","EpisodeName","LegacyAuditTrailId")
            VALUES ({x.EventId},{x.Kind},{x.RecordType},{x.Quantity},{x.OriginalValue},{x.Included},{x.OccurredAt},{x.LocalHour},{x.Period},{x.SessionId},{x.ContentId},{x.Title},{x.Path},{x.Source},{x.SourceId},{x.Note},{x.UserId},{x.ActorName},{x.ServerId},{x.ServerName},{x.EpisodeSlug},{x.EpisodeName},{x.LegacyAuditTrailId})
            ON CONFLICT DO NOTHING
            """, ct);
        // PostgreSQL maintains compatibility projections with migration triggers.
        if (inserted > 0 && db.Database.IsSqlite() && x.Kind is "article" or "reel")
        {
            var count = await db.AnalyticsLedger.Where(l => l.Kind == x.Kind && l.ContentId == x.ContentId && l.Included && l.Period == "")
                .Select(l => l.Quantity).SumAsync(ct);
            var projection = (int)Math.Min(int.MaxValue, count);
            if (x.Kind == "article") await db.News.Where(n => n.NewsId == x.ContentId).ExecuteUpdateAsync(s => s.SetProperty(n => n.ViewCount, projection), ct);
            else await db.Reel.Where(r => r.ReelId == x.ContentId).ExecuteUpdateAsync(s => s.SetProperty(r => r.ViewCount, projection), ct);
        }
        return inserted;
    }
}
