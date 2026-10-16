using System.Security.Claims;
using System.Text.Json;
using angnet.Domain.Dtos;
using angnet.Domain.Enums;
using angnet.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace angnet.Infrastructure.Data.Services;

public class BlogNotificationService(AppDbContext db, MyBlogService blog)
{
    private record Cursor(string UserId, DateTime At, string Id, DateTime SnapshotAt);

    private async Task<IQueryable<BlogNotificationModel>> Visible(ClaimsPrincipal user)
    {
        var id = MyBlogService.UserId(user);
        var news = await blog.VisibleNews(user);
        return db.BlogNotification.AsNoTracking().Where(n => n.RecipientId == id
            && news.Any(p => p.NewsId == n.NewsId)
            && db.Users.Any(u => u.Id == n.ActorId && u.FlagActive)
            && ((n.Kind == "PostLiked" && n.CommentId == null
                    && db.LikeNews.Any(l => l.NewsId == n.NewsId && l.UserId == n.ActorId))
                || (n.Kind == "Rated" && n.CommentId == null && n.Point != null
                    && db.PointNews.Any(p => p.NewsId == n.NewsId && p.UserId == n.ActorId))
                || ((n.Kind == "CommentOnPost" || n.Kind == "Reply") && db.NewsComment.Any(c => c.CommentId == n.CommentId && c.FlagActive
                && c.Status == ENewsCommentStatus.Approved
                && (c.ParentCommentId == null || db.NewsComment.Any(root => root.CommentId == c.ParentCommentId
                    && root.FlagActive && root.Status != ENewsCommentStatus.Deleted))))));
    }

    public async Task<int> Unread(ClaimsPrincipal user) =>
        await (await Visible(user)).CountAsync(n => n.ReadAt == null);

    public async Task<BlogNotificationPageDto> List(ClaimsPrincipal user, int pageSize, string? cursor)
    {
        var id = MyBlogService.UserId(user);
        Cursor? before = null;
        if (!string.IsNullOrEmpty(cursor))
        {
            try { before = JsonSerializer.Deserialize<Cursor>(Convert.FromBase64String(cursor)); }
            catch (Exception e) when (e is FormatException or JsonException) { throw new ArgumentException("Invalid cursor"); }
            if (before == null || before.UserId != id || before.At.Kind != DateTimeKind.Utc
                || before.SnapshotAt.Kind != DateTimeKind.Utc || string.IsNullOrEmpty(before.Id))
                throw new ArgumentException("Invalid cursor");
        }
        var snapshot = before?.SnapshotAt ?? DateTime.UtcNow;
        var visible = await Visible(user);
        int unread = await visible.CountAsync(n => n.ReadAt == null);
        var query = visible.Where(n => n.CreatedAt <= snapshot);
        if (before != null)
            query = query.Where(n => n.CreatedAt < before.At ||
                (n.CreatedAt == before.At && string.Compare(n.NotificationId, before.Id) < 0));
        int take = Math.Clamp(pageSize, 1, 30);
        var rows = await (from n in query
                          join actor in db.Users on n.ActorId equals actor.Id
                          join post in db.News on n.NewsId equals post.NewsId
                          join c in db.NewsComment on n.CommentId equals c.CommentId into comments
                          from comment in comments.DefaultIfEmpty()
                          orderby n.CreatedAt descending, n.NotificationId descending
                          select new BlogNotificationDto
                          {
                              NotificationId = n.NotificationId, Kind = n.Kind, NewsId = n.NewsId,
                              CategoryNewsId = post.CategoryNewsId, CommentId = n.CommentId, Point = n.Point,
                              ActorName = actor.FullName, ActorAvatar = actor.Avatar,
                              Title = post.ShortTitle, TitleEn = post.ShortTitleEn,
                              Excerpt = comment == null ? string.Empty :
                                  (comment.Content.Length > 180 ? comment.Content.Substring(0, 180) : comment.Content),
                              CreatedAt = n.CreatedAt, ReadAt = n.ReadAt,
                          }).Take(take + 1).ToListAsync();
        bool more = rows.Count > take;
        rows = rows.Take(take).ToList();
        return new BlogNotificationPageDto
        {
            DataList = rows, UnreadCount = unread, SnapshotAt = snapshot, HasMore = more,
            NextCursor = more ? Convert.ToBase64String(JsonSerializer.SerializeToUtf8Bytes(
                new Cursor(id, DateTime.SpecifyKind(rows.Last().CreatedAt, DateTimeKind.Utc), rows.Last().NotificationId, snapshot))) : null!,
        };
    }

    public async Task<int> Read(ClaimsPrincipal user, string? notificationId, DateTime? through)
    {
        var query = await Visible(user);
        var now = DateTime.UtcNow;
        if (notificationId != null) query = query.Where(n => n.NotificationId == notificationId);
        else
        {
            if (through == null || through.Value.Kind != DateTimeKind.Utc || through > now)
                throw new ArgumentException("Invalid snapshot");
            query = query.Where(n => n.CreatedAt <= through);
        }
        await query.Where(n => n.ReadAt == null).ExecuteUpdateAsync(s => s.SetProperty(n => n.ReadAt, (DateTime?)now));
        return await Unread(user);
    }
}
