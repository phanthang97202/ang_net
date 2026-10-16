using System.Security.Claims;
using angnet.Infrastructure.Data;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace angnet.WebApi.SignalR;

public class BlogNotificationPublisher(AppDbContext db, IHubContext<BlogNotificationHub> hub,
    ILogger<BlogNotificationPublisher> logger)
{
    public async Task PostReactionChanged(ClaimsPrincipal actor, string newsId)
    {
        try
        {
            var actorId = actor.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(actorId)) return;
            var author = await db.News.Where(n => n.NewsId == newsId).Select(n => n.UserId).FirstOrDefaultAsync();
            if (!string.IsNullOrEmpty(author) && author != actorId)
                await hub.Clients.User(author).SendAsync("NotificationsChanged");
        }
        catch (Exception ex)
        {
            // The reaction and notification are already saved; HTTP polling recovers delivery.
            logger.LogWarning(ex, "Could not broadcast post reaction notification for {NewsId}", newsId);
        }
    }
}
