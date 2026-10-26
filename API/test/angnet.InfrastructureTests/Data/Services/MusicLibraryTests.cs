using System.Net;
using System.Reflection;
using angnet.Domain.Dtos;
using angnet.Domain.Enums;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Services;
using angnet.WebApi.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace angnet.InfrastructureTests.Data.Services;

[TestClass]
public class MusicLibraryTests
{
    // DB giả: mọi truy vấn chạm DB sẽ lỗi kết nối, nên test nào pass là đã chặn trước DB
    private static AppDbContext Context() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseNpgsql("Host=localhost;Database=unused;Username=unused;Password=unused").Options);

    private sealed class StubHandler(HttpStatusCode status, string body) : HttpMessageHandler
    {
        public Uri? LastRequest { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            LastRequest = request.RequestUri;
            return Task.FromResult(new HttpResponseMessage(status) { Content = new StringContent(body) });
        }
    }

    private static IHttpClientFactory Clients(HttpMessageHandler handler)
    {
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(x => x.CreateClient(It.IsAny<string>())).Returns(() => new HttpClient(handler, false));
        return factory.Object;
    }

    [TestMethod]
    public void Controller_WritesNeedMusicPermission_ReadsOfSharedCollectionsAreAnonymous()
    {
        var anonymous = new[] { "Collection", "CollectionTracks" };
        foreach (MethodInfo action in typeof(MusicLibraryController).GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly))
        {
            bool allowAnonymous = action.GetCustomAttributes<AllowAnonymousAttribute>().Any();
            string? policy = action.GetCustomAttributes<AuthorizeAttribute>().SingleOrDefault()?.Policy;
            if (anonymous.Contains(action.Name))
            {
                Assert.IsTrue(allowAnonymous, action.Name);
            }
            else
            {
                Assert.IsFalse(allowAnonymous, action.Name);
                Assert.AreEqual("music.use", policy, action.Name);
            }
        }
    }

    [TestMethod]
    public async Task Service_RejectsInvalidTrackKeysBeforeSourceOrDatabase()
    {
        using var db = Context();
        var youtube = new Mock<IMusicTrackSource>(MockBehavior.Strict);
        youtube.SetupGet(x => x.Provider).Returns(EMusicProvider.YouTube);
        youtube.Setup(x => x.IsValidExternalId(It.IsAny<string>())).Returns(false);
        var service = new MusicLibraryService(db, new[] { youtube.Object });

        var invalidId = await service.SaveAsync("owner",
            new MusicTrackKeyDto { Provider = EMusicProvider.YouTube, ExternalId = "../etc" }, default);
        Assert.IsFalse(invalidId.Success);

        // Nguồn chưa đăng ký (Audius) cũng bị chặn, không ném lỗi
        var unknownProvider = await service.AddToCollectionAsync("owner",
            new MusicCollectionItemAddDto { CollectionId = "c", Provider = EMusicProvider.Audius, ExternalId = "abc" }, default);
        Assert.IsFalse(unknownProvider.Success);

        var emptyState = await service.GetSaveStateAsync("owner", new MusicSaveStateRequestDto
        {
            Tracks = [new MusicTrackKeyDto { Provider = EMusicProvider.YouTube, ExternalId = "bad id" }]
        });
        Assert.IsTrue(emptyState.Success);
        Assert.AreEqual(0, emptyState.DataList.Count);

        youtube.Verify(x => x.FetchAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [TestMethod]
    public async Task Service_ValidatesCollectionBeforeDatabase()
    {
        using var db = Context();
        var service = new MusicLibraryService(db, Array.Empty<IMusicTrackSource>());

        Assert.IsFalse((await service.CreateCollectionAsync("owner", new MusicCollectionSaveDto { Name = "  " })).Success);
        Assert.IsFalse((await service.CreateCollectionAsync("owner", new MusicCollectionSaveDto { Name = new string('a', 151) })).Success);
        Assert.IsFalse((await service.CreateCollectionAsync("owner",
            new MusicCollectionSaveDto { Name = "Chill", Visibility = (EArchiveVisibility)99 })).Success);
        Assert.IsFalse((await service.MoveCollectionItemAsync("owner",
            new MusicCollectionItemMoveDto { CollectionId = "c", TrackId = "t", Direction = "left" })).Success);
    }

    [TestMethod]
    public void Sources_AcceptOnlyWellFormedExternalIds()
    {
        var clients = Mock.Of<IHttpClientFactory>();
        var youtube = new YouTubeMusicTrackSource(clients);
        var audius = new AudiusMusicTrackSource(clients);

        Assert.IsTrue(youtube.IsValidExternalId("dQw4w9WgXcQ"));
        Assert.IsFalse(youtube.IsValidExternalId("dQw4w9WgXc"));
        Assert.IsFalse(youtube.IsValidExternalId("dQw4w9WgXc/"));
        Assert.IsTrue(audius.IsValidExternalId("D7KyD"));
        Assert.IsFalse(audius.IsValidExternalId("a/b"));
        Assert.IsFalse(audius.IsValidExternalId(""));
    }

    [TestMethod]
    public async Task YouTubeSource_UsesOEmbedAndBuildsUrlsFromVideoId()
    {
        var handler = new StubHandler(HttpStatusCode.OK,
            """{"title":"Song","author_name":"Artist","author_url":"https://www.youtube.com/@artist","thumbnail_url":"https://evil.example/x.jpg"}""");
        var metadata = await new YouTubeMusicTrackSource(Clients(handler)).FetchAsync("dQw4w9WgXcQ", default);

        StringAssert.StartsWith(handler.LastRequest!.AbsoluteUri, "https://www.youtube.com/oembed?");
        Assert.AreEqual("Song", metadata.Title);
        Assert.AreEqual("Artist", metadata.Artist);
        // Ảnh không lấy theo link nguồn trả về mà dựng từ videoId
        Assert.AreEqual("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg", metadata.ThumbnailUrl);
        Assert.AreEqual("https://www.youtube.com/watch?v=dQw4w9WgXcQ", metadata.ExternalUrl);
    }

    [TestMethod]
    public async Task Sources_ReportUnavailableTracks()
    {
        await Assert.ThrowsExceptionAsync<MusicTrackUnavailableException>(() =>
            new YouTubeMusicTrackSource(Clients(new StubHandler(HttpStatusCode.Unauthorized, "")))
                .FetchAsync("dQw4w9WgXcQ", default));
        await Assert.ThrowsExceptionAsync<MusicTrackUnavailableException>(() =>
            new AudiusMusicTrackSource(Clients(new StubHandler(HttpStatusCode.OK,
                """{"data":{"title":"Gone","is_delete":true}}""")))
                .FetchAsync("D7KyD", default));
    }

    [TestMethod]
    public async Task AudiusSource_KeepsOnlyHttpsUrls()
    {
        var handler = new StubHandler(HttpStatusCode.OK, """
            {"data":{"title":"Track","duration":215,"genre":"Lo-Fi","permalink":"/artist/track",
             "artwork":{"480x480":"http://insecure.example/a.jpg","150x150":"https://cdn.audius.co/a.jpg"},
             "user":{"name":"","handle":"artist"}}}
            """);
        var metadata = await new AudiusMusicTrackSource(Clients(handler)).FetchAsync("D7KyD", default);

        Assert.AreEqual("artist", metadata.Artist);
        Assert.AreEqual(215, metadata.DurationSeconds);
        Assert.AreEqual("https://cdn.audius.co/a.jpg", metadata.ThumbnailUrl);
        Assert.AreEqual("https://audius.co/artist/track", metadata.ExternalUrl);
    }
}
