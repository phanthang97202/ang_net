using System.Globalization;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
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
        if (context == null || string.IsNullOrWhiteSpace(userId) || data.MovieSlug.Length > 200) return false;
        var actor = Clip(context.User.Identity?.Name ?? userId, 256);
        var requested = context.Request.Headers["X-Blog-Session"].ToString();
        var navigation = context.Request.Headers["X-Blog-Navigation"].ToString();
        var path = context.Request.Headers["X-Blog-Page"].ToString();
        var browser = context.Request.Headers["X-Blog-Visitor"].ToString();
        var hasContext = WebAnalyticsService.ValidContext(requested, navigation, path) && path == $"/phim/{data.MovieSlug}";
        var id = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(hasContext
            ? $"movie|{userId}|{(Guid.TryParse(browser, out _) ? browser : requested).ToLowerInvariant()}|{navigation.ToLowerInvariant()}|{data.MovieSlug}|{data.ServerId}|{data.EpisodeSlug}"
            : $"movie-request|{context.TraceIdentifier}|{data.MovieSlug}|{data.ServerId}|{data.EpisodeSlug}")));
        var now = clock.GetUtcNow().UtcDateTime;
        var hour = now.AddHours(7).ToString("yyyy-MM-ddTHH", CultureInfo.InvariantCulture);
        return await writer.Write(async token =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync(token);
            if (!await db.MovieViewLog.AnyAsync(x => x.EventId == id, token))
            {
                var session = hasContext ? await sessions.Resolve(requested, browser, true, token) : null;
                await db.Database.ExecuteSqlInterpolatedAsync($"""
                    INSERT INTO "MovieViewLog" ("EventId", "OccurredAt", "LocalHour", "SessionId", "UserId", "ActorName",
                        "MovieSlug", "MovieTitle", "ServerId", "ServerName", "EpisodeSlug", "EpisodeName", "Source")
                    VALUES ({id}, {now}, {hour}, {session}, {userId}, {actor}, {data.MovieSlug}, {Clip(data.MovieTitle, 500)},
                        {data.ServerId}, {Clip(data.ServerName, 200)}, {Clip(data.EpisodeSlug, 200)}, {Clip(data.EpisodeName, 200)}, 'playback')
                    ON CONFLICT ("EventId") DO NOTHING
                    """, token);
            }
            await transaction.CommitAsync(token);
        }, ct);
    }

    private static string Clip(string value, int max) => (value.Length > max ? value[..max] : value).Replace('\r', ' ').Replace('\n', ' ');
}
