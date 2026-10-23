using System.Globalization;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace angnet.Infrastructure.Data.Services;

public sealed class MovieViewLogService(AppDbContext db, WebsiteSessionService sessions, AnalyticsWriter writer,
    TimeProvider clock, IHttpContextAccessor accessor) : IMovieViewLogService
{
    public async Task<bool> RecordAsync(MovieViewWriteDto data, CancellationToken ct = default)
    {
        var context = accessor.HttpContext;
        var userId = context?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (context == null || string.IsNullOrWhiteSpace(userId) || data.MovieSlug.Length > 200
            || WebAnalyticsService.IsBot(context.Request.Headers.UserAgent.ToString())) return false;
        var actor = Clip(context.User.Identity?.Name ?? userId, 256);
        var requested = context.Request.Headers["X-Blog-Session"].ToString();
        var navigation = context.Request.Headers["X-Blog-Navigation"].ToString();
        var path = context.Request.Headers["X-Blog-Page"].ToString();
        var browser = context.Request.Headers["X-Blog-Visitor"].ToString();
        var hasContext = WebAnalyticsService.ValidContext(requested, navigation, path) && path == $"/phim/{data.MovieSlug}";
        if (!hasContext) return false;
        var id = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(
            $"movie|{userId}|{(Guid.TryParse(browser, out _) ? browser : requested).ToLowerInvariant()}|{navigation.ToLowerInvariant()}|{data.MovieSlug}|{data.ServerId}|{data.EpisodeSlug}")));
        var now = clock.GetUtcNow().UtcDateTime;
        var hour = now.AddHours(7).ToString("yyyy-MM-ddTHH", CultureInfo.InvariantCulture);
        return await writer.Write(async token =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync(token);
            if (!await db.AnalyticsLedger.AnyAsync(x => x.EventId == id, token))
            {
                var session = hasContext ? await sessions.Resolve(requested, browser, true, token) : null;
                await AnalyticsLedgerStore.Insert(db, new AnalyticsLedgerModel
                {
                    EventId = id, Kind = "movie", OccurredAt = now, LocalHour = hour,
                    SessionId = session, UserId = userId, ActorName = actor,
                    ContentId = data.MovieSlug, Title = Clip(data.MovieTitle, 500), Path = path,
                    ServerId = data.ServerId, ServerName = Clip(data.ServerName, 200),
                    EpisodeSlug = Clip(data.EpisodeSlug, 200), EpisodeName = Clip(data.EpisodeName, 200), Source = "playback",
                }, token);
            }
            await transaction.CommitAsync(token);
        }, ct);
    }

    private static string Clip(string value, int max) => (value.Length > max ? value[..max] : value).Replace('\r', ' ').Replace('\n', ' ');
}
