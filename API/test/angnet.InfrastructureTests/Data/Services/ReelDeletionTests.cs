using System.Net;
using System.Security.Claims;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.Domain.Enums;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Repositories;
using angnet.Infrastructure.Data.Services;
using angnet.Infrastructure.Data.UnitOfWork;
using angnet.WebApi.Cloudinary;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace angnet.InfrastructureTests.Data.Services;

[TestClass]
public class ReelDeletionTests
{
    private SqliteConnection connection = null!;
    private AppDbContext db = null!;
    private ReelService service = null!;
    private ReelMediaStorage storage = null!;
    private readonly RecordingHandler handler = new();
    private static string Image(string id) => $"https://res.cloudinary.com/test-cloud/image/upload/v123/reels/image/{id}.jpg";
    private static ClaimsPrincipal User(string id, params Claim[] extra) => new(new ClaimsIdentity(
        new[] { new Claim(ClaimTypes.NameIdentifier, id) }.Concat(extra), "test"));

    [TestInitialize]
    public async Task Setup()
    {
        connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        db = new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        db.Users.AddRange(new AppUser { Id = "me", FullName = "Me", FlagActive = true },
            new AppUser { Id = "other", FullName = "Other", FlagActive = true });
        await db.SaveChangesAsync();
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Cloudinary:CloudName"] = "test-cloud", ["Cloudinary:ApiKey"] = "test-key", ["Cloudinary:ApiSecret"] = "test-secret",
        }).Build();
        var clients = new Mock<IHttpClientFactory>();
        clients.Setup(c => c.CreateClient(It.IsAny<string>())).Returns(() => new HttpClient(handler, false));
        storage = new(configuration, clients.Object, NullLogger<ReelMediaStorage>.Instance);
        var context = new DefaultHttpContext();
        var accessorMock = new Mock<IHttpContextAccessor>();
        accessorMock.SetupGet(a => a.HttpContext).Returns(context);
        var accessor = accessorMock.Object;
        var repository = new ReelRespository(db, accessor);
        var uow = new Mock<IUnitOfWork>();
        uow.SetupGet(u => u.ReelRespository).Returns(repository);
        uow.SetupGet(u => u.ReelCommentRespository).Returns(new ReelCommentRespository(db, accessor));
        service = new(db, accessor, uow.Object, storage);
    }

    [TestCleanup]
    public async Task Cleanup()
    {
        await db.DisposeAsync();
        await connection.DisposeAsync();
        handler.Dispose();
    }

    private async Task Seed(string id = "reel", string owner = "me", bool managed = true, params string[] urls)
    {
        db.Reel.Add(new ReelModel { ReelId = id, UserId = owner, MediaType = EReelMediaType.Image, CoverUrl = urls.FirstOrDefault() ?? "", FlagActive = true });
        db.ReelMedia.AddRange(urls.Select(url => new ReelMediaModel { ReelId = id, MediaUrl = url, IsCloudinaryManaged = managed, FlagActive = true }));
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();
    }

    [TestMethod]
    public async Task OwnerDelete_DestroysEveryImageOnce_AndInvalidatesCdn()
    {
        await Seed(urls: [Image("old-a"), Image("old-b"), Image("old-a")]);
        var response = await service.Delete(User("me"), "reel");
        Assert.IsTrue(response.Success);
        Assert.IsFalse((await db.Reel.AsNoTracking().SingleAsync()).FlagActive);
        Assert.AreEqual(2, handler.Calls.Count);
        CollectionAssert.AreEquivalent(new[] { "reels/image/old-a", "reels/image/old-b" }, handler.Calls.Select(c => c.Form["public_id"]).ToArray());
        Assert.IsTrue(handler.Calls.All(c => c.Url.EndsWith("/image/destroy") && c.Form["invalidate"] == "true"));
        Assert.IsTrue(handler.Calls.All(c => c.Form["signature"] == CloudinaryAccount.Sign(
            $"invalidate=true&public_id={c.Form["public_id"]}&timestamp={c.Form["timestamp"]}", "test-secret")));
        // A repeated request is idempotent and never deletes another file.
        Assert.IsTrue((await service.Delete(User("me"), "reel")).Success);
        Assert.AreEqual(2, handler.Calls.Count);
    }

    [TestMethod]
    public async Task VideoPoster_UsesTheSameVideoAssetAndIsNotDeletedAsAnImage()
    {
        await Seed(urls: ["https://res.cloudinary.com/test-cloud/video/upload/v123/reels/video/old-video.mp4"]);
        await db.Reel.Where(r => r.ReelId == "reel").ExecuteUpdateAsync(s => s.SetProperty(r => r.CoverUrl,
            "https://res.cloudinary.com/test-cloud/video/upload/so_0/reels/video/old-video.jpg"));
        Assert.IsTrue((await service.Delete(User("me"), "reel")).Success);
        Assert.AreEqual(1, handler.Calls.Count);
        Assert.IsTrue(handler.Calls[0].Url.EndsWith("/video/destroy"));
        Assert.AreEqual("reels/video/old-video", handler.Calls[0].Form["public_id"]);
    }

    [TestMethod]
    public async Task NonOwnerCannotDelete_ButTheExistingDeletePermissionCanModerate()
    {
        await Seed(urls: [Image("old-a")]);
        Assert.IsFalse((await service.Delete(User("other"), "reel")).Success);
        Assert.IsFalse((await service.Delete(new ClaimsPrincipal(), "reel")).Success);
        Assert.AreEqual(0, handler.Calls.Count);
        Assert.IsTrue((await db.Reel.AsNoTracking().SingleAsync()).FlagActive);
        Assert.IsTrue((await service.Delete(User("other", new Claim("permission", "reel.delete")), "reel")).Success);
        Assert.AreEqual(1, handler.Calls.Count);
    }

    [TestMethod]
    public async Task CloudinaryFailure_KeepsTheRecordRetryable_AndNotFoundCompletesTheRetry()
    {
        await Seed(urls: [Image("old-a"), Image("old-b")]);
        handler.Responses.Enqueue((HttpStatusCode.OK, "{\"result\":\"ok\"}"));
        handler.Responses.Enqueue((HttpStatusCode.ServiceUnavailable, "{}"));
        Assert.IsFalse((await service.Delete(User("me"), "reel")).Success);
        Assert.IsTrue((await db.Reel.AsNoTracking().SingleAsync()).FlagActive);
        handler.Responses.Enqueue((HttpStatusCode.OK, "{\"result\":\"not found\"}"));
        Assert.IsTrue((await service.Delete(User("me"), "reel")).Success);
        Assert.IsFalse((await db.Reel.AsNoTracking().SingleAsync()).FlagActive);
        Assert.AreEqual(4, handler.Calls.Count);
    }

    [TestMethod]
    public async Task SharedAsset_IsPreservedUntilTheLastReelIsDeleted_EvenWithTransforms()
    {
        await Seed(urls: [Image("shared")]);
        await Seed("second", "me", false,
            "https://res.cloudinary.com/test-cloud/image/upload/c_fill,w_200/v456/reels/image/shared.jpg");
        Assert.IsTrue((await service.Delete(User("me"), "reel")).Success);
        Assert.AreEqual(0, handler.Calls.Count);
        Assert.IsTrue((await service.Delete(User("me"), "second")).Success);
        Assert.AreEqual(1, handler.Calls.Count);
    }

    [TestMethod]
    public async Task LinkedMedia_IsNotDestroyed_AndCreateCannotClaimSomeoneElsesUploads()
    {
        await Seed(managed: false, urls: ["https://example.com/image.jpg", Image("copied-legacy")]);
        Assert.IsTrue((await service.Delete(User("me"), "reel")).Success);
        Assert.AreEqual(0, handler.Calls.Count);
        var own = Image("me/own-upload");
        var response = await service.Create(User("me"), new ReelCreateDto
        {
            MediaType = EReelMediaType.Image,
            Media = [new() { MediaUrl = own }, new() { MediaUrl = Image("other/foreign") }, new() { MediaUrl = Image("copied-legacy") }],
        });
        Assert.IsTrue(response.Success);
        var rows = await db.ReelMedia.AsNoTracking().Where(m => m.ReelId == response.Data.ReelId).ToListAsync();
        Assert.AreEqual(1, rows.Count(m => m.IsCloudinaryManaged));
        Assert.AreEqual(own, rows.Single(m => m.IsCloudinaryManaged).MediaUrl);
    }

    [TestMethod]
    public async Task DeletedReel_IsHiddenFromFeedDetailAndCommentEndpoints()
    {
        await Seed(managed: false, urls: ["https://example.com/image.jpg"]);
        db.ReelComment.Add(new ReelCommentModel { CommentId = "parent", ReelId = "reel", UserId = "me", Content = "Comment", FlagActive = true });
        db.ReelComment.Add(new ReelCommentModel { CommentId = "reply", ReelId = "reel", UserId = "me", Content = "Reply", ParentCommentId = "parent", FlagActive = true });
        await db.SaveChangesAsync();
        Assert.AreEqual(1, ((CursorPageInfo<ReelCommentDto>)(await service.GetComments(User("me"), "reel", 20, null!)).objResult).DataList.Count);
        Assert.IsTrue((await service.Delete(User("me"), "reel")).Success);
        Assert.IsFalse((await service.Detail(User("me"), "reel")).Success);
        Assert.AreEqual(0, ((CursorPageInfo<ReelDto>)(await service.GetFeed(User("me"), 10, null!)).objResult).DataList.Count);
        Assert.AreEqual(0, ((CursorPageInfo<ReelCommentDto>)(await service.GetComments(User("me"), "reel", 20, null!)).objResult).DataList.Count);
        Assert.AreEqual(0, ((CursorPageInfo<ReelCommentDto>)(await service.GetReplies(User("me"), "parent", 20, null!)).objResult).DataList.Count);
    }

    [TestMethod]
    public async Task MissingCloudinaryConfiguration_DoesNotSilentlyFinishADeletion()
    {
        var missing = new ReelMediaStorage(new ConfigurationBuilder().Build(), Mock.Of<IHttpClientFactory>(), NullLogger<ReelMediaStorage>.Instance);
        Assert.IsFalse(await missing.DeleteAsync([new("test-cloud", "image", "reels/image/old-a")]));
        Assert.IsNull(storage.GetFile("https://res.cloudinary.com.evil.test/test-cloud/image/upload/reels/image/a.jpg"));
        Assert.IsNull(storage.GetFile("https://res.cloudinary.com/test-cloud/image/upload/avatars/user.jpg"));
        Assert.IsFalse(await storage.DeleteAsync([new("other-cloud", "image", "reels/image/a")]));
        Assert.AreEqual(0, handler.Calls.Count);
    }

    private sealed class RecordingHandler : HttpMessageHandler
    {
        public List<(string Url, Dictionary<string, string> Form)> Calls { get; } = [];
        public Queue<(HttpStatusCode Status, string Body)> Responses { get; } = [];
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var form = (await request.Content!.ReadAsStringAsync(cancellationToken)).Split('&')
                .Select(p => p.Split('=', 2)).ToDictionary(p => WebUtility.UrlDecode(p[0]), p => WebUtility.UrlDecode(p[1]));
            Calls.Add((request.RequestUri!.ToString(), form));
            var response = Responses.Count > 0 ? Responses.Dequeue() : (HttpStatusCode.OK, "{\"result\":\"ok\"}");
            return new HttpResponseMessage(response.Item1) { Content = new StringContent(response.Item2) };
        }
    }
}
