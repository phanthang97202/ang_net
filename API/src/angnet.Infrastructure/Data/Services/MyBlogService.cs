using System.Security.Claims;
using System.Text;
using System.Text.Json;
using angnet.Domain.Dtos;
using angnet.Domain.Enums;
using angnet.Domain.Models;
using Microsoft.EntityFrameworkCore;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;

namespace angnet.Infrastructure.Data.Services;

public class MyBlogService(AppDbContext db)
{
    private record FeedCursor(string UserId, string Feed, DateTime At, string Id);

    internal static string UserId(ClaimsPrincipal user) =>
        user.Identity?.IsAuthenticated == true && user.FindFirstValue(ClaimTypes.NameIdentifier) is { Length: > 0 } id
            ? id : throw new UnauthorizedAccessException();

    internal async Task<IQueryable<NewsModel>> VisibleNews(ClaimsPrincipal user)
    {
        var id = UserId(user);
        bool admin = user.IsInRole("Admin");
        int tenant = await db.Users.Where(u => u.Id == id).Select(u => u.TenantId).FirstOrDefaultAsync();
        return db.News.AsNoTracking().Where(n =>
            (!n.FlagActive && (n.UserId == id || admin)) ||
            (n.FlagActive && (n.UserId == id || admin || db.NewsCategory.Any(c => c.NewsCategoryId == n.CategoryNewsId && c.FlagActive))
                && (n.WhoCanSee == EWhoCanSee.Public || n.UserId == id ||
                    (n.WhoCanSee == EWhoCanSee.Tenant && tenant > 0 && db.Users.Any(u => u.Id == n.UserId && u.TenantId == tenant)))));
    }

    public async Task<MyFavoritesPageDto> Favorites(ClaimsPrincipal user, int pageSize, string? cursor)
    {
        var id = UserId(user);
        var before = ReadCursor(cursor, id, "favorites");
        var visible = await VisibleNews(user);
        var query = from like in db.LikeNews.AsNoTracking()
                    join news in visible on like.NewsId equals news.NewsId
                    where like.UserId == id
                    select new { Like = like, News = news };
        int count = await query.CountAsync();
        if (before != null)
            query = query.Where(x => x.Like.CreatedDTime < before.At ||
                (x.Like.CreatedDTime == before.At && string.Compare(x.Like.LikeNewsId, before.Id) < 0));
        int take = Math.Clamp(pageSize, 1, 30);
        var rows = await query.OrderByDescending(x => x.Like.CreatedDTime).ThenByDescending(x => x.Like.LikeNewsId)
            .Take(take + 1).ToListAsync();
        bool more = rows.Count > take;
        rows = rows.Take(take).ToList();
        var authorIds = rows.Select(x => x.News.UserId).Distinct().ToArray();
        var authors = await db.Users.Where(u => authorIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.FullName);
        var posts = rows.Select(x => new RPNewsDto
        {
            NewsId = x.News.NewsId, UserId = x.News.UserId, CategoryNewsId = x.News.CategoryNewsId,
            Slug = x.News.Slug, SlugEn = x.News.SlugEn, Thumbnail = x.News.Thumbnail,
            ShortTitle = x.News.ShortTitle, ShortTitleEn = x.News.ShortTitleEn,
            ShortDescription = x.News.ShortDescription, ShortDescriptionEn = x.News.ShortDescriptionEn,
            HasEnglishTranslation = !string.IsNullOrWhiteSpace(x.News.ContentBodyEn) && !string.IsNullOrWhiteSpace(x.News.ShortTitleEn),
            FullName = authors.GetValueOrDefault(x.News.UserId, ""),
            CreatedDTime = x.News.CreatedDTime, FlagActive = x.News.FlagActive, WhoCanSee = x.News.WhoCanSee,
            ViewCount = x.News.ViewCount, IsLikedByMe = true,
            EstimatedReadingTime = TCommonUtils.CalculateReadingTime(x.News.ContentBody).Minutes,
            EstimatedReadingTimeEn = TCommonUtils.CalculateReadingTime(x.News.ContentBodyEn).Minutes,
        }).ToList();
        return new MyFavoritesPageDto
        {
            DataList = posts, ItemCount = count, HasMore = more,
            NextCursor = more ? WriteCursor(id, "favorites", rows.Last().Like.CreatedDTime, rows.Last().Like.LikeNewsId) : null!,
        };
    }

    public async Task<CursorPageInfo<BlogActivityDto>> Activity(ClaimsPrincipal user, int pageSize, string? cursor)
    {
        var id = UserId(user);
        var before = ReadCursor(cursor, id, "activity");
        var visible = await VisibleNews(user);
        var query = from activity in db.BlogActivity.AsNoTracking()
                    join news in visible on activity.NewsId equals news.NewsId
                    where activity.UserId == id
                    select new BlogActivityDto
                    {
                        ActivityId = activity.ActivityId, Kind = activity.Kind, OccurredAt = activity.OccurredAt,
                        NewsId = news.NewsId, CategoryNewsId = news.CategoryNewsId,
                        Title = news.ShortTitle, TitleEn = news.ShortTitleEn,
                        HasEnglishTranslation = news.ContentBodyEn != "" && news.ShortTitleEn != "",
                        CommentId = activity.CommentId, Point = activity.Point,
                        // Never expose moderated/deleted comments, or a different author's comment text.
                        CommentContent = activity.Kind == "Commented" ? db.NewsComment
                            .Where(c => c.CommentId == activity.CommentId && c.UserId == id && c.FlagActive
                                && c.Status == ENewsCommentStatus.Approved && db.Users.Any(u => u.Id == id && u.FlagActive))
                            .Select(c => c.Content).FirstOrDefault() : null,
                    };
        if (before != null)
            query = query.Where(x => x.OccurredAt < before.At ||
                (x.OccurredAt == before.At && string.Compare(x.ActivityId, before.Id) < 0));
        int take = Math.Clamp(pageSize, 1, 30);
        var rows = await query.OrderByDescending(x => x.OccurredAt).ThenByDescending(x => x.ActivityId)
            .Take(take + 1).ToListAsync();
        bool more = rows.Count > take;
        rows = rows.Take(take).ToList();
        return new CursorPageInfo<BlogActivityDto>
        {
            DataList = rows, HasMore = more,
            NextCursor = more ? WriteCursor(id, "activity", rows.Last().OccurredAt, rows.Last().ActivityId) : null!,
        };
    }

    private static string WriteCursor(string userId, string feed, DateTime at, string id) =>
        Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new FeedCursor(userId, feed, DateTime.SpecifyKind(at, DateTimeKind.Utc), id))));

    private static FeedCursor? ReadCursor(string? value, string userId, string feed)
    {
        if (string.IsNullOrEmpty(value)) return null;
        try
        {
            if (value.Length > 2048) throw new FormatException();
            var cursor = JsonSerializer.Deserialize<FeedCursor>(Convert.FromBase64String(value));
            if (cursor == null || cursor.UserId != userId || cursor.Feed != feed || string.IsNullOrEmpty(cursor.Id)
                || cursor.Id.Length > 200 || cursor.At.Kind != DateTimeKind.Utc) throw new FormatException();
            return cursor;
        }
        catch (Exception ex) when (ex is FormatException or JsonException)
        { throw new ArgumentException("Cursor không hợp lệ."); }
    }
}
