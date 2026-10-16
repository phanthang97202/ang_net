using System.Security.Claims;
using angnet.Domain.Dtos;
using angnet.Domain.Enums;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Repositories;
using angnet.Infrastructure.Data.Services;
using angnet.Infrastructure.Data.UnitOfWork;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using StackExchange.Redis;

namespace angnet.InfrastructureTests.Data.Services;

[TestClass]
public class BlogNotificationTests
{
    private SqliteConnection connection = null!;
    private AppDbContext db = null!;
    private NewsCommentRepository comments = null!;
    private BlogNotificationService service = null!;
    private static readonly DateTime Now = DateTime.UtcNow.AddHours(-1);
    private static ClaimsPrincipal User(string id) => new(new ClaimsIdentity(new[]
    { new Claim(ClaimTypes.NameIdentifier, id) }, "test"));

    [TestInitialize]
    public async Task Setup()
    {
        connection = new("Data Source=:memory:");
        await connection.OpenAsync();
        db = new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        db.Users.AddRange(new[] { "author", "reader", "actor", "stranger" }.Select(id => new AppUser
        { Id = id, FullName = id, FlagActive = true, TenantId = 1 }));
        db.NewsCategory.Add(new NewsCategoryModel { NewsCategoryId = "category", FlagActive = true });
        db.News.Add(new NewsModel
        {
            NewsId = "post", CategoryNewsId = "category", UserId = "author", ShortTitle = "A post",
            FlagActive = true, WhoCanSee = EWhoCanSee.Public, CreatedDTime = Now, UpdatedDTime = Now,
        });
        await db.SaveChangesAsync();
        comments = new(db, Mock.Of<IHttpContextAccessor>(a => a.HttpContext == new DefaultHttpContext()));
        service = new(db, new MyBlogService(db));
    }

    private static NewsCommentModel Comment(string id, string actor = "actor", string? parent = null, DateTime? at = null) => new()
    {
        CommentId = id, NewsId = "post", UserId = actor, ParentCommentId = parent, Content = "Content " + id,
        Status = ENewsCommentStatus.Approved, FlagActive = true, CreatedDTime = at ?? Now, UpdatedDTime = at ?? Now,
    };

    private NewsRespository NewsRepository(string actor = "actor")
    {
        var context = new DefaultHttpContext { User = User(actor) };
        var accessor = Mock.Of<IHttpContextAccessor>(x => x.HttpContext == context);
        var redis = new Mock<IConnectionMultiplexer>();
        redis.Setup(x => x.GetDatabase(It.IsAny<int>(), It.IsAny<object>())).Returns(Mock.Of<IDatabase>());
        return new NewsRespository(db, accessor, null!, Mock.Of<IWebHostEnvironment>(), redis.Object);
    }

    [TestMethod]
    public async Task PostHearts_NotifyOnlyAuthorAndDisappearOnUnlikeWithoutDuplicatingOnRelike()
    {
        var news = NewsRepository();
        Assert.IsTrue((await news.Like(User("actor"), "post")).Success);
        var first = (await service.List(User("author"), 15, null)).DataList.Single();
        Assert.AreEqual("PostLiked", first.Kind); Assert.IsNull(first.CommentId);
        Assert.AreEqual("", first.Excerpt); Assert.AreEqual(1, await service.Unread(User("author")));
        Assert.AreEqual(0, await service.Unread(User("actor")));
        Assert.AreEqual(0, await service.Unread(User("reader")));
        await news.Like(User("actor"), "post");
        Assert.AreEqual(0, await service.Unread(User("author")));
        Assert.AreEqual(0, await db.BlogNotification.CountAsync());
        await news.Like(User("actor"), "post");
        Assert.AreEqual(1, await db.BlogNotification.CountAsync());
        await NewsRepository("author").Like(User("author"), "post");
        Assert.AreEqual(1, await db.BlogNotification.CountAsync());
    }

    [TestMethod]
    public async Task Ratings_IncludeExactScoreAndUpdateOneNotificationOnlyWhenScoreChanges()
    {
        var news = NewsRepository();
        await news.Point(User("actor"), "post", 8);
        var first = (await service.List(User("author"), 15, null)).DataList.Single();
        Assert.AreEqual("Rated", first.Kind); Assert.AreEqual(8d, first.Point); Assert.IsNull(first.CommentId);
        await service.Read(User("author"), first.NotificationId, null);
        await news.Point(User("actor"), "post", 8);
        Assert.AreEqual(0, await service.Unread(User("author")), "Repeated identical ratings must not notify again.");
        await news.Point(User("actor"), "post", 9.5);
        var updated = (await service.List(User("author"), 15, null)).DataList.Single();
        Assert.AreEqual(first.NotificationId, updated.NotificationId);
        Assert.AreEqual(9.5, updated.Point); Assert.IsNull(updated.ReadAt);
        await news.Point(User("actor"), "post", 0);
        Assert.AreEqual(0d, (await service.List(User("author"), 15, null)).DataList.Single().Point);
        await NewsRepository("author").Point(User("author"), "post", 10);
        Assert.AreEqual(1, await db.BlogNotification.CountAsync());
    }

    [TestMethod]
    public async Task MixedNotifications_KeepPrivacyAndReadStateForCommentsHeartsAndRatings()
    {
        await comments.AddComment(Comment("comment"));
        var news = NewsRepository();
        await news.Like(User("actor"), "post");
        await news.Point(User("actor"), "post", 7);
        var page = await service.List(User("author"), 15, null);
        CollectionAssert.AreEquivalent(new[] { "CommentOnPost", "PostLiked", "Rated" }, page.DataList.Select(n => n.Kind).ToArray());
        Assert.AreEqual(3, page.UnreadCount);
        Assert.AreEqual(0, await service.Read(User("author"), null, page.SnapshotAt));
        Assert.IsTrue((await service.List(User("author"), 15, null)).DataList.All(n => n.ReadAt != null));
        var post = await db.News.SingleAsync();
        post.UserId = "reader"; post.WhoCanSee = EWhoCanSee.Private;
        await db.SaveChangesAsync();
        Assert.AreEqual(0, (await service.List(User("author"), 15, null)).DataList.Count);
    }

    [TestCleanup] public async Task Cleanup() { await db.DisposeAsync(); await connection.DisposeAsync(); }

    [TestMethod]
    public async Task CommentCreation_IsAtomicAndNotifiesAuthorAndActualReplyRecipientWithoutSelfOrDuplicates()
    {
        await comments.AddComment(Comment("root", "reader"));
        await comments.AddComment(Comment("reply", "actor", "root"));
        CollectionAssert.AreEquivalent(new[] { "author", "reader" }, await db.BlogNotification
            .Where(n => n.CommentId == "reply").Select(n => n.RecipientId).ToArrayAsync());
        await comments.AddComment(Comment("author-root", "author"));
        Assert.IsFalse(await db.BlogNotification.AnyAsync(n => n.CommentId == "author-root"));
        await comments.AddComment(Comment("dedup", "actor", "author-root"));
        var dedup = await db.BlogNotification.SingleAsync(n => n.CommentId == "dedup");
        Assert.AreEqual("author", dedup.RecipientId); Assert.AreEqual("Reply", dedup.Kind);
        await comments.AddComment(Comment("self-reply", "reader", "root"));
        Assert.AreEqual("author", (await db.BlogNotification.SingleAsync(n => n.CommentId == "self-reply")).RecipientId);
        Assert.AreEqual(await db.NewsComment.CountAsync(), await db.BlogActivity.CountAsync());
    }

    [TestMethod]
    public async Task ReadState_IsPersistentOwnerScopedAndReadAllDoesNotConsumeNewArrivals()
    {
        await comments.AddComment(Comment("first"));
        var first = await service.List(User("author"), 15, null);
        var item = first.DataList.Single();
        Assert.AreEqual(1, first.UnreadCount);
        Assert.AreEqual(0, await service.Read(User("stranger"), item.NotificationId, null));
        Assert.AreEqual(1, await service.Unread(User("author")));
        await comments.AddComment(Comment("new", at: first.SnapshotAt.AddTicks(1)));
        Assert.AreEqual(1, await service.Read(User("author"), null, first.SnapshotAt));
        Assert.IsNotNull((await service.List(User("author"), 15, null)).DataList.Single(n => n.CommentId == "first").ReadAt);
        Assert.AreEqual(0, await service.Read(User("author"), (await db.BlogNotification.SingleAsync(n => n.CommentId == "new")).NotificationId, null));
        Assert.AreEqual(0, await new BlogNotificationService(db, new MyBlogService(db)).Unread(User("author")));
        await Assert.ThrowsExceptionAsync<UnauthorizedAccessException>(() => service.Unread(new ClaimsPrincipal()));
    }

    [TestMethod]
    public async Task Visibility_IsReevaluatedForPrivatePostsModerationAndDisabledActors()
    {
        await comments.AddComment(Comment("root", "reader"));
        await comments.AddComment(Comment("reply", parent: "root"));
        Assert.AreEqual(1, await service.Unread(User("reader")));
        var post = await db.News.SingleAsync(); post.WhoCanSee = EWhoCanSee.Private;
        await db.SaveChangesAsync();
        Assert.AreEqual(0, await service.Unread(User("reader")));
        Assert.AreEqual(0, (await service.List(User("reader"), 15, null)).DataList.Count);
        post.WhoCanSee = EWhoCanSee.Public;
        (await db.NewsComment.SingleAsync(c => c.CommentId == "reply")).Status = ENewsCommentStatus.Rejected;
        await db.SaveChangesAsync();
        Assert.AreEqual(0, await service.Unread(User("reader")));
        (await db.NewsComment.SingleAsync(c => c.CommentId == "reply")).Status = ENewsCommentStatus.Approved;
        (await db.Users.SingleAsync(u => u.Id == "actor")).FlagActive = false;
        await db.SaveChangesAsync();
        Assert.AreEqual(0, await service.Unread(User("reader")));
    }

    [TestMethod]
    public async Task Cursor_IsStableWithTiedDatesAndBoundToRecipient()
    {
        foreach (var id in new[] { "a", "b", "c" }) await comments.AddComment(Comment(id));
        var first = await service.List(User("author"), 1, null);
        var second = await service.List(User("author"), 1, first.NextCursor);
        var last = await service.List(User("author"), 1, second.NextCursor);
        Assert.AreEqual(3, new[] { first, second, last }.SelectMany(p => p.DataList).Select(n => n.NotificationId).Distinct().Count());
        Assert.IsFalse(last.HasMore);
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.List(User("reader"), 1, first.NextCursor));
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.List(User("author"), 1, "invalid"));
    }

    [TestMethod]
    public async Task Context_FindsOffPageReplyAndSanitizesHiddenRootsWithoutLeakingPrivateContent()
    {
        await comments.AddComment(Comment("root", "reader"));
        for (int i = 0; i < 8; i++) await comments.AddComment(Comment("reply" + i, parent: "root"));
        var context = await comments.GetContext("post", "reply7", "author");
        Assert.AreEqual("reply7", context!.Replies.Single().CommentId);
        (await db.NewsComment.SingleAsync(c => c.CommentId == "root")).Status = ENewsCommentStatus.Rejected;
        await db.SaveChangesAsync();
        context = await comments.GetContext("post", "reply7", "author");
        Assert.IsTrue(context!.IsHidden); Assert.AreEqual("", context.Content);
        (await db.NewsComment.SingleAsync(c => c.CommentId == "reply7")).Status = ENewsCommentStatus.Pending;
        await db.SaveChangesAsync();
        Assert.IsNull(await comments.GetContext("post", "reply7", "author"));
        var work = new Mock<IUnitOfWork>(); work.SetupGet(w => w.NewsCommentRepository).Returns(comments);
        var commentService = new NewsCommentService(db, new HttpContextAccessor(), work.Object);
        (await db.News.SingleAsync()).WhoCanSee = EWhoCanSee.Private;
        await db.SaveChangesAsync();
        Assert.IsNull((await commentService.GetContext(User("reader"), "post", "reply1")).Data);
    }

    [TestMethod]
    public async Task ReplyToReply_ValidatesTargetAndNotifiesItsAuthorInsteadOfOnlyRootAuthor()
    {
        await comments.AddComment(Comment("root", "author"));
        await comments.AddComment(Comment("reply", "reader", "root"));
        var work = new Mock<IUnitOfWork>(); work.SetupGet(w => w.NewsCommentRepository).Returns(comments);
        var commentService = new NewsCommentService(db, new HttpContextAccessor(), work.Object);
        var response = await commentService.AddComment(User("actor"), new NewsCommentCreateDto
        { NewsId = "post", ParentCommentId = "root", ReplyToCommentId = "reply", Content = "Reply to reader" });
        Assert.IsTrue(response.Success);
        CollectionAssert.AreEquivalent(new[] { "author", "reader" }, await db.BlogNotification
            .Where(n => n.CommentId == response.Data.CommentId).Select(n => n.RecipientId).ToArrayAsync());
        var invalid = await commentService.AddComment(User("actor"), new NewsCommentCreateDto
        { NewsId = "post", ParentCommentId = "root", ReplyToCommentId = "missing", Content = "Invalid target" });
        Assert.IsFalse(invalid.Success);
    }

    [TestMethod]
    public async Task Migration_CreatesNotificationTableWithoutBackfillingOldUnreadEvents()
    {
        await db.Database.ExecuteSqlRawAsync("DROP TABLE \"BlogNotification\";");
        var assembly = typeof(AppDbContext).Assembly;
        var resource = assembly.GetManifestResourceNames().Single(n => n.EndsWith("0052_ThongBaoTuongTac.sql"));
        using var reader = new StreamReader(assembly.GetManifestResourceStream(resource)!);
        await db.Database.ExecuteSqlRawAsync(await reader.ReadToEndAsync());
        Assert.AreEqual(0, await db.BlogNotification.CountAsync());
        // This checks the original 0052 schema; 0053 adds the nullable reaction fields.
    }
}
