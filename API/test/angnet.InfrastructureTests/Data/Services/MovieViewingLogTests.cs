using System.Net;
using System.Security.Claims;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.Domain.Enums;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Repositories;
using angnet.Infrastructure.Data.Services;
using angnet.Infrastructure.Data.UnitOfWork;
using angnet.WebApi.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace angnet.InfrastructureTests.Data.Services;

[TestClass]
public class MovieViewingLogTests
{
    private SqliteConnection connection = null!;
    private AppDbContext db = null!;
    private Mock<IMovieLibraryService> library = null!;
    private Mock<IAuditTrailService> audit = null!;
    private MovieLibraryController controller = null!;
    private HttpContext context = null!;
    private static MovieLibraryPlaybackDto Playback() => new()
    {
        Title = "Tập 1", Url = "https://media.example/secret-playlist.m3u8?token=secret",
        EmbedUrl = "https://player.phimapi.com/player/?url=secret",
    };

    [TestInitialize]
    public async Task Setup()
    {
        connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        context = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "viewer-1"), new Claim(ClaimTypes.Name, "Viewer One"),
            }, "test")),
        };
        context.Request.Method = "GET";
        context.Request.Path = "/api/Movie/Library/test-film/playback";
        context.Connection.RemoteIpAddress = IPAddress.Parse("192.0.2.23");
        var accessor = new Mock<IHttpContextAccessor>();
        accessor.SetupGet(x => x.HttpContext).Returns(context);
        var repository = new AuditTrailRespository(db, accessor.Object);
        var uow = new Mock<IUnitOfWork>();
        uow.SetupGet(x => x.AuditTrailRespository).Returns(repository);
        var actualAudit = new AuditTrailService(db, accessor.Object, uow.Object);
        audit = new Mock<IAuditTrailService>();
        audit.Setup(x => x.Create(It.IsAny<AuditTrailDto>())).Returns((AuditTrailDto data) => actualAudit.Create(data));
        library = new Mock<IMovieLibraryService>(MockBehavior.Strict);
        library.Setup(x => x.Playback("test-film", 3, "tap-1", It.IsAny<CancellationToken>())).ReturnsAsync(Playback);
        library.Setup(x => x.Detail("test-film", It.IsAny<CancellationToken>())).ReturnsAsync(new MovieLibraryDetailDto
        {
            Slug = "test-film", Title = "Tên phim từ nguồn", Servers = [new() { Id = 3, Name = "Vietsub" }],
        });
        controller = new MovieLibraryController(library.Object, Mock.Of<IMovieWishlistService>(),
            Mock.Of<IMovieWatchProgressService>(), audit.Object, Mock.Of<ILogger<MovieLibraryController>>())
        { ControllerContext = new ControllerContext { HttpContext = context } };
    }

    [TestCleanup]
    public async Task Cleanup() { await db.DisposeAsync(); await connection.DisposeAsync(); }

    [DataTestMethod]
    [DataRow(false)]
    [DataRow(true)]
    public async Task PlayableEpisode_WritesOneSearchableSystemLog_WithTrustedMovieAndCurrentAccount(bool embedOnly)
    {
        var playback = Playback();
        if (embedOnly) playback.Url = "";
        library.Setup(x => x.Playback("test-film", 3, "tap-1", It.IsAny<CancellationToken>())).ReturnsAsync(playback);
        var before = DateTime.UtcNow;
        Assert.IsInstanceOfType(await controller.Playback("test-film", 3, "tap-1", default), typeof(OkObjectResult));
        var row = await db.AuditTrail.AsNoTracking().SingleAsync();
        Assert.AreEqual("phimapi:test-film", row.RecordId);
        Assert.AreEqual("Viewer One", row.ChangedBy);
        StringAssert.Contains(row.Description, "Mở xem phim");
        StringAssert.Contains(row.Description, "Tên phim từ nguồn");
        StringAssert.Contains(row.Description, "Tập 1 (tap-1)");
        StringAssert.Contains(row.Description, "Vietsub (3)");
        StringAssert.Contains(row.Description, "viewer-1");
        Assert.AreEqual("192.0.2.23", row.IPAddress);
        Assert.AreEqual(context.Request.Path.Value, row.RequestUrl);
        Assert.AreEqual(EAuditTrailType.GET, row.TrailType);
        Assert.AreEqual(EAuditTrailLevel.INFORMATION, row.Level);
        Assert.IsTrue(row.ChangedDTime >= before && row.ChangedDTime <= DateTime.UtcNow);
        Assert.IsFalse((row.Description + row.NewValues).Contains("secret", StringComparison.Ordinal));
        var accessor = Mock.Of<IHttpContextAccessor>();
        var repository = new AuditTrailRespository(db, accessor);
        Assert.AreEqual(1, repository.Search(0, 20, "Tên phim từ nguồn", "", "GET").TotalCount);
        Assert.AreEqual(1, repository.Search(0, 20, "viewer-1", "", "").TotalCount);
        audit.Verify(x => x.Create(It.IsAny<AuditTrailDto>()), Times.Once);
    }

    [TestMethod]
    public async Task AccountWithoutName_StillHasAnIdentifiableActorInTheSystemLog()
    {
        context.User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, "viewer-1") }, "test"));
        await controller.Playback("test-film", 3, "tap-1", default);
        Assert.AreEqual("viewer-1", (await db.AuditTrail.AsNoTracking().SingleAsync()).ChangedBy);
    }

    [TestMethod]
    public async Task CancelledPlayback_DoesNotRecordAViewing()
    {
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();
        context.RequestAborted = cancellation.Token;
        var result = (StatusCodeResult)await controller.Playback("test-film", 3, "tap-1", cancellation.Token);
        Assert.AreEqual(499, result.StatusCode);
        audit.Verify(x => x.Create(It.IsAny<AuditTrailDto>()), Times.Never);
    }

    [TestMethod]
    public async Task UnauthenticatedRequest_DoesNotFetchPlaybackOrWriteLog()
    {
        context.User = new ClaimsPrincipal();
        Assert.IsInstanceOfType(await controller.Playback("test-film", 3, "tap-1", default), typeof(UnauthorizedResult));
        library.Verify(x => x.Playback(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        audit.Verify(x => x.Create(It.IsAny<AuditTrailDto>()), Times.Never);
        Assert.AreEqual("movie.view", typeof(MovieLibraryController).GetCustomAttributes(typeof(AuthorizeAttribute), false).Cast<AuthorizeAttribute>().Single().Policy);
    }

    [TestMethod]
    public async Task MissingOrUnavailableEpisode_DoesNotRecordAViewing()
    {
        foreach (var error in new Exception[] { new KeyNotFoundException("Missing"), new HttpRequestException("Unavailable"), new ArgumentException("Invalid") })
        {
            library.Setup(x => x.Playback("test-film", 3, "tap-1", It.IsAny<CancellationToken>())).ThrowsAsync(error);
            var result = await controller.Playback("test-film", 3, "tap-1", default);
            Assert.IsFalse(result is OkObjectResult);
        }
        audit.Verify(x => x.Create(It.IsAny<AuditTrailDto>()), Times.Never);
    }

    [TestMethod]
    public async Task EmptyPlayback_DoesNotCreateAFakeViewingLog()
    {
        library.Setup(x => x.Playback("test-film", 3, "tap-1", It.IsAny<CancellationToken>())).ReturnsAsync(new MovieLibraryPlaybackDto());
        await controller.Playback("test-film", 3, "tap-1", default);
        audit.Verify(x => x.Create(It.IsAny<AuditTrailDto>()), Times.Never);
    }

    [TestMethod]
    public async Task MetadataFailure_StillLogsTheValidatedSlugAndEpisode()
    {
        library.Setup(x => x.Detail("test-film", It.IsAny<CancellationToken>())).ThrowsAsync(new HttpRequestException("Labels unavailable"));
        Assert.IsInstanceOfType(await controller.Playback("test-film", 3, "tap-1", default), typeof(OkObjectResult));
        var row = await db.AuditTrail.AsNoTracking().SingleAsync();
        StringAssert.Contains(row.Description, "test-film");
        StringAssert.Contains(row.Description, "tap-1");
        StringAssert.Contains(row.Description, "viewer-1");
    }

    [TestMethod]
    public async Task AuditFailure_NeverPreventsPlayback()
    {
        audit.Setup(x => x.Create(It.IsAny<AuditTrailDto>())).ThrowsAsync(new InvalidOperationException("Database unavailable"));
        var response = (OkObjectResult)await controller.Playback("test-film", 3, "tap-1", default);
        Assert.AreEqual(Playback().Url, ((ApiResponse<MovieLibraryPlaybackDto>)response.Value!).Data.Url);
        audit.Setup(x => x.Create(It.IsAny<AuditTrailDto>())).ReturnsAsync(new ApiResponse<AuditTrailDto>("Audit rejected"));
        Assert.IsInstanceOfType(await controller.Playback("test-film", 3, "tap-1", default), typeof(OkObjectResult));
    }

    [TestMethod]
    public async Task BrowsingAndLoadingMovieDetails_DoNotRecordAViewing()
    {
        library.Setup(x => x.Browse("", 1, default)).ReturnsAsync(new MovieLibraryCatalogDto());
        var wishlist = new Mock<IMovieWishlistService>();
        wishlist.Setup(x => x.MarkSaved(It.IsAny<string>(), It.IsAny<IEnumerable<MovieLibraryItemDto>>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        controller = new MovieLibraryController(library.Object, wishlist.Object, Mock.Of<IMovieWatchProgressService>(), audit.Object, Mock.Of<ILogger<MovieLibraryController>>())
        { ControllerContext = new ControllerContext { HttpContext = context } };
        await controller.Browse();
        await controller.Detail("test-film", default);
        audit.Verify(x => x.Create(It.IsAny<AuditTrailDto>()), Times.Never);
    }
}
