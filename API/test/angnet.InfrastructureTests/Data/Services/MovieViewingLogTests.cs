using System.Security.Claims;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Services;
using angnet.WebApi.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace angnet.InfrastructureTests.Data.Services;

[TestClass]
public class MovieViewingLogTests
{
    private SqliteConnection connection = null!;
    private AppDbContext db = null!;
    private Mock<IMovieLibraryService> library = null!;
    private Mock<IMovieViewLogService> log = null!;
    private MovieLibraryController controller = null!;
    private HttpContext context = null!;
    private static MovieLibraryPlaybackDto Playback() => new()
    {
        Title = "Tập 1", Url = "https://media.example/secret-playlist.m3u8?token=secret",
        EmbedUrl = "https://player.example/player/?url=secret",
    };

    [TestInitialize]
    public async Task Setup()
    {
        connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        context = new DefaultHttpContext { TraceIdentifier = Guid.NewGuid().ToString(),
            User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier,"viewer-1"), new Claim(ClaimTypes.Name,"Viewer One") }, "test")) };
        var accessor = Mock.Of<IHttpContextAccessor>(x => x.HttpContext == context);
        context.Request.Headers.UserAgent = "Mozilla/5.0 Chrome/130.0 Safari/537.36";
        context.Request.Headers["X-Blog-Session"] = Guid.NewGuid().ToString();
        context.Request.Headers["X-Blog-Navigation"] = Guid.NewGuid().ToString();
        context.Request.Headers["X-Blog-Visitor"] = Guid.NewGuid().ToString();
        context.Request.Headers["X-Blog-Page"] = "/phim/test-film";
        var clock = TimeProvider.System;
        var actual = new MovieViewLogService(db, new WebsiteSessionService(db,clock),
            new AnalyticsWriter(db,clock,new AnalyticsWriteHealth(),NullLogger<AnalyticsWriter>.Instance), clock, accessor);
        log = new Mock<IMovieViewLogService>();
        log.Setup(x=>x.RecordAsync(It.IsAny<MovieViewWriteDto>(),It.IsAny<CancellationToken>()))
            .Returns((MovieViewWriteDto data,CancellationToken ct)=>actual.RecordAsync(data,ct));
        library = new Mock<IMovieLibraryService>(MockBehavior.Strict);
        library.Setup(x=>x.Playback("test-film",3,"tap-1",It.IsAny<CancellationToken>())).ReturnsAsync(Playback);
        library.Setup(x=>x.Detail("test-film",It.IsAny<CancellationToken>())).ReturnsAsync(new MovieLibraryDetailDto
        {
            Slug="test-film",Title="Tên phim từ nguồn",Servers=[new(){Id=3,Name="Vietsub"}],
        });
        controller = Build();
    }
    private MovieLibraryController Build(IMovieWishlistService? wishlist = null) => new(library.Object,wishlist ?? Mock.Of<IMovieWishlistService>(),
        Mock.Of<IMovieWatchProgressService>(),log.Object,NullLogger<MovieLibraryController>.Instance)
        {ControllerContext = new ControllerContext {HttpContext=context}};
    [TestCleanup] public async Task Cleanup() { await db.DisposeAsync(); await connection.DisposeAsync(); }

    [DataTestMethod, DataRow(false), DataRow(true)]
    public async Task PlayableEpisode_WritesStructuredLogOnly_WithoutPlaybackSecrets(bool embedOnly)
    {
        var playback = Playback(); if(embedOnly) playback.Url="";
        library.Setup(x=>x.Playback("test-film",3,"tap-1",It.IsAny<CancellationToken>())).ReturnsAsync(playback);
        var before = DateTime.UtcNow;
        Assert.IsInstanceOfType(await controller.Playback("test-film",3,"tap-1",default),typeof(OkObjectResult));
        var row = await db.AnalyticsLedger.AsNoTracking().SingleAsync(x => x.Kind == "movie");
        Assert.AreEqual("test-film",row.ContentId); Assert.AreEqual("Tên phim từ nguồn",row.Title);
        Assert.AreEqual("viewer-1",row.UserId); Assert.AreEqual("Viewer One",row.ActorName);
        Assert.AreEqual("tap-1",row.EpisodeSlug); Assert.AreEqual("Tập 1",row.EpisodeName);
        Assert.AreEqual(3,row.ServerId); Assert.AreEqual("Vietsub",row.ServerName);
        Assert.IsTrue(row.OccurredAt>=before && row.OccurredAt<=DateTime.UtcNow);
        Assert.AreEqual(0,await db.AuditTrail.CountAsync());
        Assert.AreEqual(0,await db.AnalyticsEvent.CountAsync());
        Assert.AreEqual(0,await db.MovieViewLog.CountAsync());
        Assert.IsFalse(System.Text.Json.JsonSerializer.Serialize(row).Contains("secret",StringComparison.Ordinal));
    }

    [TestMethod]
    public async Task AccountWithoutName_StillHasIdentifiableActor()
    {
        context.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier,"viewer-1")],"test"));
        await controller.Playback("test-film",3,"tap-1",default);
        Assert.AreEqual("viewer-1",(await db.AnalyticsLedger.SingleAsync(x => x.Kind == "movie")).ActorName);
    }

    [TestMethod]
    public async Task AnonymousCancelledMissingAndEmptyPlayback_DoNotCreateLogs()
    {
        var original = context.User;
        context.User = new ClaimsPrincipal();
        Assert.IsInstanceOfType(await controller.Playback("test-film",3,"tap-1",default),typeof(UnauthorizedResult));
        context.User = original;
        using var cancel = new CancellationTokenSource(); cancel.Cancel(); context.RequestAborted=cancel.Token;
        Assert.AreEqual(499,((StatusCodeResult)await controller.Playback("test-film",3,"tap-1",cancel.Token)).StatusCode);
        context.RequestAborted=default;
        foreach(var error in new Exception[]{new KeyNotFoundException(),new HttpRequestException(),new ArgumentException()})
        {
            library.Setup(x=>x.Playback("test-film",3,"tap-1",It.IsAny<CancellationToken>())).ThrowsAsync(error);
            Assert.IsFalse(await controller.Playback("test-film",3,"tap-1",default) is OkObjectResult);
        }
        library.Setup(x=>x.Playback("test-film",3,"tap-1",It.IsAny<CancellationToken>())).ReturnsAsync(new MovieLibraryPlaybackDto());
        await controller.Playback("test-film",3,"tap-1",default);
        Assert.AreEqual(0,await db.MovieViewLog.CountAsync());
        log.Verify(x=>x.RecordAsync(It.IsAny<MovieViewWriteDto>(),It.IsAny<CancellationToken>()),Times.Never);
    }

    [TestMethod]
    public async Task MetadataFailure_UsesValidatedIdentifiers()
    {
        library.Setup(x=>x.Detail("test-film",It.IsAny<CancellationToken>())).ThrowsAsync(new HttpRequestException());
        await controller.Playback("test-film",3,"tap-1",default);
        var row = await db.AnalyticsLedger.SingleAsync(x => x.Kind == "movie");
        Assert.AreEqual("test-film",row.Title); Assert.AreEqual("tap-1",row.EpisodeSlug);
    }

    [TestMethod]
    public async Task StorageFailure_DoesNotBlockPlayback()
    {
        log.Setup(x=>x.RecordAsync(It.IsAny<MovieViewWriteDto>(),It.IsAny<CancellationToken>())).ThrowsAsync(new InvalidOperationException());
        Assert.IsInstanceOfType(await controller.Playback("test-film",3,"tap-1",default),typeof(OkObjectResult));
        log.Setup(x=>x.RecordAsync(It.IsAny<MovieViewWriteDto>(),It.IsAny<CancellationToken>())).ReturnsAsync(false);
        Assert.IsInstanceOfType(await controller.Playback("test-film",3,"tap-1",default),typeof(OkObjectResult));
    }

    [TestMethod]
    public async Task NavigationRetryIsDeduplicated_AnotherEpisodeOrRequestCounts()
    {
        context.Request.Headers["X-Blog-Session"]=Guid.NewGuid().ToString();
        context.Request.Headers["X-Blog-Navigation"]=Guid.NewGuid().ToString();
        context.Request.Headers["X-Blog-Visitor"]=Guid.NewGuid().ToString();
        context.Request.Headers["X-Blog-Page"]="/phim/test-film";
        await controller.Playback("test-film",3,"tap-1",default);
        await controller.Playback("test-film",3,"tap-1",default);
        Assert.AreEqual(1,await db.AnalyticsLedger.CountAsync(x => x.Kind == "movie"));
        Assert.AreEqual(1,await db.WebsiteSession.CountAsync());
        context.Request.Headers["X-Blog-Navigation"]=Guid.NewGuid().ToString();
        await controller.Playback("test-film",3,"tap-1",default);
        Assert.AreEqual(2,await db.AnalyticsLedger.CountAsync(x => x.Kind == "movie"));
        Assert.AreEqual(1,await db.WebsiteSession.CountAsync());
    }

    [TestMethod]
    public async Task BrowseAndDetail_DoNotLog_AndPlaybackKeepsPermission()
    {
        library.Setup(x=>x.Browse("",1,default)).ReturnsAsync(new MovieLibraryCatalogDto());
        var wishlist=new Mock<IMovieWishlistService>();
        wishlist.Setup(x=>x.MarkSaved(It.IsAny<string>(),It.IsAny<IEnumerable<MovieLibraryItemDto>>(),It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        controller=Build(wishlist.Object);
        await controller.Browse(); await controller.Detail("test-film",default);
        log.Verify(x=>x.RecordAsync(It.IsAny<MovieViewWriteDto>(),It.IsAny<CancellationToken>()),Times.Never);
        Assert.AreEqual("movie.view",typeof(MovieLibraryController).GetCustomAttributes(typeof(AuthorizeAttribute),false).Cast<AuthorizeAttribute>().Single().Policy);
    }

    [TestMethod]
    public async Task ContextFreeAndBotPlaybackDoNotCreateViewsOrReportStorageFailure()
    {
        context.Request.Headers.Remove("X-Blog-Session");
        Assert.IsInstanceOfType<OkObjectResult>(await controller.Playback("test-film",3,"tap-1",default));
        context.Request.Headers["X-Blog-Session"] = Guid.NewGuid().ToString();
        context.Request.Headers.UserAgent = "Googlebot/2.1";
        Assert.IsInstanceOfType<OkObjectResult>(await controller.Playback("test-film",3,"tap-1",default));
        log.Verify(x => x.RecordAsync(It.IsAny<MovieViewWriteDto>(), It.IsAny<CancellationToken>()), Times.Never);
        Assert.AreEqual(0, await db.AnalyticsLedger.CountAsync());
    }
}
