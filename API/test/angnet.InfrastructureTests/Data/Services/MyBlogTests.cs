using System.Security.Claims;
using angnet.Domain.Enums;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Repositories;
using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using StackExchange.Redis;

namespace angnet.InfrastructureTests.Data.Services;

[TestClass]
public class MyBlogTests
{
    private SqliteConnection connection = null!;
    private AppDbContext db = null!;
    private MyBlogService service = null!;
    private static readonly DateTime Now = new(2026, 10, 16, 7, 0, 0, DateTimeKind.Utc);
    private static ClaimsPrincipal User(string id = "me", bool admin = false) => new(new ClaimsIdentity(new[]
    {
        new Claim(ClaimTypes.NameIdentifier, id), new Claim(ClaimTypes.Role, admin ? "Admin" : "User"),
    }, "test"));

    [TestInitialize]
    public async Task Setup()
    {
        connection = new("Data Source=:memory:");
        await connection.OpenAsync();
        db = new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        db.Users.AddRange(new AppUser { Id = "me", TenantId = 1, FullName = "Me", FlagActive = true },
            new AppUser { Id = "other", TenantId = 1, FullName = "Other", FlagActive = true },
            new AppUser { Id = "outsider", TenantId = 2, FlagActive = true });
        db.NewsCategory.AddRange(new NewsCategoryModel { NewsCategoryId = "live", FlagActive = true },
            new NewsCategoryModel { NewsCategoryId = "hidden", FlagActive = false });
        db.News.AddRange(Post("public"), Post("private", visibility: EWhoCanSee.Private),
            Post("tenant", visibility: EWhoCanSee.Tenant), Post("mine", "me", EWhoCanSee.Private),
            Post("draft", active: false), Post("hidden", category: "hidden"));
        await db.SaveChangesAsync();
        service = new(db);
    }

    private static NewsModel Post(string id, string author = "other", EWhoCanSee visibility = EWhoCanSee.Public,
        bool active = true, string category = "live") => new()
    {
        NewsId = id, UserId = author, CategoryNewsId = category, ShortTitle = id, Slug = id,
        ContentBody = "<p>Article content</p>", WhoCanSee = visibility, FlagActive = active,
        CreatedDTime = Now, UpdatedDTime = Now,
    };

    private void Like(string newsId, string id, string user = "me", DateTime? at = null) => db.LikeNews.Add(new()
    { NewsId = newsId, LikeNewsId = id, UserId = user, CreatedDTime = at ?? Now, UpdatedDTime = at ?? Now });

    [TestCleanup] public async Task Cleanup() { await db.DisposeAsync(); await connection.DisposeAsync(); }

    [TestMethod]
    public async Task Favorites_AreOwnedByViewerAndRespectCurrentPostVisibility()
    {
        foreach (var id in new[] { "public", "private", "tenant", "mine", "draft", "hidden" }) Like(id, id);
        Like("public", "someone-else", "other");
        await db.SaveChangesAsync();
        var page = await service.Favorites(User(), 30, null);
        CollectionAssert.AreEquivalent(new[] { "public", "tenant", "mine" }, page.DataList.Select(x => x.NewsId).ToArray());
        Assert.AreEqual(3, page.ItemCount);
        Assert.IsTrue(page.DataList.All(x => x.IsLikedByMe && x.ContentBody == ""));
        var other = await service.Favorites(User("other"), 30, null);
        Assert.AreEqual("public", other.DataList.Single().NewsId);
        var admin = await service.Favorites(User(admin: true), 30, null);
        Assert.IsFalse(admin.DataList.Any(x => x.NewsId == "private"), "Admin cannot bypass another author's Private setting.");
        Assert.IsTrue(admin.DataList.Any(x => x.NewsId == "draft"));
        await Assert.ThrowsExceptionAsync<UnauthorizedAccessException>(() => service.Favorites(new ClaimsPrincipal(), 12, null));
    }

    [TestMethod]
    public async Task Favorites_CursorHandlesTiesInsertsAndDeletesWithoutOffsetDrift()
    {
        Like("public", "c"); Like("tenant", "b"); Like("mine", "a");
        await db.SaveChangesAsync();
        var first = await service.Favorites(User(), 1, null);
        Assert.AreEqual("public", first.DataList.Single().NewsId);
        Assert.IsTrue(first.HasMore);
        db.News.Add(Post("new")); Like("new", "new", at: Now.AddSeconds(1));
        db.LikeNews.Remove(await db.LikeNews.SingleAsync(x => x.LikeNewsId == "c"));
        await db.SaveChangesAsync();
        var second = await service.Favorites(User(), 1, first.NextCursor);
        Assert.AreEqual("tenant", second.DataList.Single().NewsId);
        var last = await service.Favorites(User(), 1, second.NextCursor);
        Assert.AreEqual("mine", last.DataList.Single().NewsId);
        Assert.IsFalse(last.HasMore); Assert.IsNull(last.NextCursor);
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.Favorites(User("other"), 1, first.NextCursor));
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.Activity(User(), 1, first.NextCursor));
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.Activity(User(), 1, "invalid"));
    }

    [TestMethod]
    public async Task Activity_MergesKindsKeepsEventValuesAndDoesNotLeakCommentsOrOtherAccounts()
    {
        db.NewsComment.AddRange(new NewsCommentModel { CommentId = "mine", NewsId = "public", UserId = "me", Content = "My comment", FlagActive = true, Status = ENewsCommentStatus.Approved },
            new NewsCommentModel { CommentId = "hidden", NewsId = "public", UserId = "me", Content = "Moderated text", FlagActive = true, Status = ENewsCommentStatus.Rejected });
        db.BlogActivity.AddRange(
            new BlogActivityModel { ActivityId = "d", UserId = "me", NewsId = "public", Kind = "Rated", Point = 8, OccurredAt = Now },
            new BlogActivityModel { ActivityId = "c", UserId = "me", NewsId = "public", Kind = "Commented", CommentId = "mine", OccurredAt = Now },
            new BlogActivityModel { ActivityId = "b", UserId = "me", NewsId = "public", Kind = "Commented", CommentId = "hidden", OccurredAt = Now },
            new BlogActivityModel { ActivityId = "a", UserId = "me", NewsId = "public", Kind = "PostUnliked", OccurredAt = Now },
            new BlogActivityModel { UserId = "other", NewsId = "public", Kind = "PostLiked", OccurredAt = Now },
            new BlogActivityModel { UserId = "me", NewsId = "private", Kind = "PostLiked", OccurredAt = Now });
        await db.SaveChangesAsync();
        var first = await service.Activity(User(), 2, null);
        CollectionAssert.AreEqual(new[] { "Rated", "Commented" }, first.DataList.Select(x => x.Kind).ToArray());
        Assert.AreEqual(8d, first.DataList[0].Point);
        Assert.AreEqual("My comment", first.DataList[1].CommentContent);
        var next = await service.Activity(User(), 2, first.NextCursor);
        Assert.IsNull(next.DataList[0].CommentContent);
        Assert.AreEqual("PostUnliked", next.DataList[1].Kind);
        Assert.IsFalse(next.HasMore);
    }

    [TestMethod]
    public async Task RealInteractionWrites_KeepEveryEventAfterUnlikeAndRerating()
    {
        var context = new DefaultHttpContext { User = User() };
        var accessor = Mock.Of<IHttpContextAccessor>(x => x.HttpContext == context);
        var redis = new Mock<IConnectionMultiplexer>();
        redis.Setup(x => x.GetDatabase(It.IsAny<int>(), It.IsAny<object>())).Returns(Mock.Of<IDatabase>());
        var news = new NewsRespository(db, accessor, null!, Mock.Of<IWebHostEnvironment>(), redis.Object);
        Assert.IsTrue((await news.Like(context.User, "public")).Success);
        Assert.IsTrue((await news.Like(context.User, "public")).Success);
        Assert.AreEqual(0, await db.LikeNews.CountAsync());
        await news.Point(context.User, "public", 8);
        await news.Point(context.User, "public", 10);
        Assert.AreEqual(10d, (await db.PointNews.SingleAsync()).Point);
        var comments = new NewsCommentRepository(db, accessor);
        await comments.AddComment(new NewsCommentModel { CommentId = "comment", NewsId = "public", UserId = "me", Content = "Hello", FlagActive = true, Status = ENewsCommentStatus.Approved, CreatedDTime = Now });
        await comments.ToggleLike("comment", "me", Now.AddSeconds(1));
        await comments.ToggleLike("comment", "me", Now.AddSeconds(2));
        CollectionAssert.AreEquivalent(new[] { "PostLiked", "PostUnliked", "Rated", "Rated", "Commented", "CommentLiked", "CommentUnliked" },
            (await db.BlogActivity.ToListAsync()).Select(x => x.Kind).ToArray());
        CollectionAssert.AreEquivalent(new[] { 8d, 10d }, await db.BlogActivity.Where(x => x.Kind == "Rated").Select(x => x.Point!.Value).ToArrayAsync());
        int events = await db.BlogActivity.CountAsync();
        Assert.IsFalse((await news.Like(context.User, "private")).Success);
        Assert.AreEqual(events, await db.BlogActivity.CountAsync());
    }

    [TestMethod]
    public async Task Migration_BackfillsSurvivingInteractionsWithTheirOriginalTimes()
    {
        Like("public", "legacy-like");
        db.NewsComment.Add(new NewsCommentModel { CommentId = "legacy-comment", NewsId = "public", UserId = "me", Content = "Legacy", FlagActive = true, Status = ENewsCommentStatus.Approved, CreatedDTime = Now });
        db.NewsCommentReaction.Add(new NewsCommentReactionModel { CommentId = "legacy-comment", UserId = "other", CreatedDTime = Now.AddMinutes(1) });
        db.PointNews.Add(new PointNewsModel { UserId = "me", NewsId = "public", Point = 6, CreatedDTime = Now, UpdatedDTime = Now.AddMinutes(2) });
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();
        await db.Database.ExecuteSqlRawAsync("DROP TABLE \"BlogActivity\"; DROP INDEX \"IX_LikeNews_UserId_CreatedDTime_LikeNewsId\";");
        // SQLite exercises the migration/backfill locally; production PostgreSQL provides GREATEST natively.
        connection.CreateFunction("GREATEST", (string left, string right) => string.CompareOrdinal(left, right) >= 0 ? left : right);
        var assembly = typeof(AppDbContext).Assembly;
        string resource = assembly.GetManifestResourceNames().Single(x => x.EndsWith("0051_LichSuHoatDongBlog.sql"));
        using var reader = new StreamReader(assembly.GetManifestResourceStream(resource)!);
        await db.Database.ExecuteSqlRawAsync(await reader.ReadToEndAsync());
        var rows = await db.BlogActivity.ToListAsync();
        CollectionAssert.AreEquivalent(new[] { "PostLiked", "Commented", "CommentLiked", "Rated" }, rows.Select(x => x.Kind).ToArray());
        Assert.AreEqual(Now.AddMinutes(2), rows.Single(x => x.Kind == "Rated").OccurredAt);
        Assert.AreEqual(Now, rows.Single(x => x.Kind == "PostLiked").OccurredAt);
        Assert.AreEqual("other", rows.Single(x => x.Kind == "CommentLiked").UserId);
    }
}
