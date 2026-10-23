using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Services;
using angnet.WebApi.Controllers;
using angnet.WebApi.Filters;
using angnet.Domain.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace angnet.InfrastructureTests.Data.Services;

[TestClass]
public class WebAnalyticsTests
{
    private SqliteConnection connection = null!;
    private AppDbContext db = null!;
    private WebAnalyticsService service = null!;
    private TestClock clock = null!;
    private readonly string session = Guid.NewGuid().ToString();
    private readonly string navigation = Guid.NewGuid().ToString();

    [TestInitialize]
    public async Task Setup()
    {
        connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        clock = new TestClock { Now = DateTimeOffset.Parse("2026-10-23T04:00:00Z") };
        db.AnalyticsCollection.Add(new() { Id = 1, StartedAt = DateTime.Parse("2026-09-01T00:00:00Z").ToUniversalTime() });
        await db.SaveChangesAsync();
        service = new(db, clock, new WebsiteSessionService(db, clock), new AnalyticsWriter(db, clock, new AnalyticsWriteHealth(), NullLogger<AnalyticsWriter>.Instance), new AnalyticsWriteHealth(), new Microsoft.Extensions.Caching.Memory.MemoryCache(new Microsoft.Extensions.Caching.Memory.MemoryCacheOptions()));
    }

    [TestCleanup]
    public async Task Cleanup() { await db.DisposeAsync(); await connection.DisposeAsync(); }

    [TestMethod]
    public async Task RetriesAreIdempotentButNewNavigationsCount()
    {
        await service.Record(session, navigation, "page", "", "", "/news");
        await service.Record(session, navigation, "page", "", "", "/news");
        await service.Record(session, Guid.NewGuid().ToString(), "page", "", "", "/news");
        clock.Now = clock.Now.AddSeconds(1);
        var report = await service.Report("2026-10-23", "2026-10-23");
        Assert.AreEqual(2, report.Current.Pages);
        Assert.AreEqual(1, report.Current.Sessions);
        Assert.AreEqual(24, report.Points.Count);
        Assert.AreEqual(2, report.Points.Single(x => x.Bucket == "2026-10-23T11").Pages);
    }

    [TestMethod]
    public async Task VietnamMidnightAndDateBoundariesAreRespected()
    {
        clock.Now = DateTimeOffset.Parse("2026-10-22T16:59:59Z");
        await service.Record(session, navigation, "page", "", "", "/");
        clock.Now = clock.Now.AddSeconds(1);
        await service.Record(session, Guid.NewGuid().ToString(), "page", "", "", "/");
        clock.Now = clock.Now.AddHours(1);
        var report = await service.Report("2026-10-23", "2026-10-23");
        Assert.AreEqual(1, report.Current.Pages);
        Assert.AreEqual(0, report.Previous.Pages); // Same elapsed hour of the previous day.
        Assert.AreEqual(1, report.Points[0].Pages);
        var yesterday = await service.Report("2026-10-22", "2026-10-22");
        Assert.AreEqual(1, yesterday.Current.Pages);
    }

    [TestMethod]
    public async Task TopContentIsGroupedAcrossTitlesAndCountsDistinctSessions()
    {
        await service.Record(session, navigation, "article", "article-1", "Tên ban đầu", "/news/topic/article-1");
        await service.Record(session, Guid.NewGuid().ToString(), "article", "article-1", "Tên mới", "/news/topic/article-1");
        await service.Record(Guid.NewGuid().ToString(), navigation, "article", "article-1", "Tên mới", "/news/topic/article-1");
        await service.Record(session, navigation, "movie", "film-1", "Tên phim", "/phim/film-1", "1:tap-1");
        await service.Record(session, navigation, "movie", "film-1", "Tên phim", "/phim/film-1", "1:tap-1");
        await service.Record(session, navigation, "movie", "film-1", "Tên phim", "/phim/film-1", "1:tap-2");
        clock.Now = clock.Now.AddSeconds(1);
        var report = await service.Report("2026-10-23", "2026-10-23");
        Assert.AreEqual(3, report.Current.Articles);
        Assert.AreEqual(0, report.Current.Movies);
        Assert.AreEqual(1, report.TopArticles.Count);
        Assert.AreEqual(3, report.TopArticles[0].Views);
        Assert.AreEqual(2, report.TopArticles[0].Sessions);
        Assert.AreEqual(0, report.TopMovies.Count);
    }

    [TestMethod]
    public async Task MultiDayChartUsesDailyBucketsAndUniqueSessionsForWholeRange()
    {
        clock.Now = clock.Now.AddDays(-1);
        await service.Record(session, navigation, "page", "", "", "/");
        clock.Now = clock.Now.AddDays(1);
        await service.Record(session, Guid.NewGuid().ToString(), "page", "", "", "/news");
        clock.Now = clock.Now.AddSeconds(1);
        var report = await service.Report("2026-10-22", "2026-10-23");
        Assert.AreEqual(2, report.Points.Count);
        Assert.AreEqual(2, report.Current.Sessions);
        Assert.AreEqual(1, report.Points[0].Sessions);
        Assert.AreEqual(1, report.Points[1].Sessions);
        Assert.AreEqual(2, report.Current.Pages);
    }

    [TestMethod]
    public async Task ComparisonUsesSameElapsedTimeAndCoverageIsExplicit()
    {
        clock.Now = DateTimeOffset.Parse("2026-10-22T05:00:00Z"); // noon yesterday, outside 11am comparison
        await service.Record(session, navigation, "page", "", "", "/");
        clock.Now = DateTimeOffset.Parse("2026-10-23T04:00:00Z");
        var report = await service.Report("2026-10-23", "2026-10-23");
        Assert.AreEqual(0, report.Previous.Pages);
        Assert.IsTrue(report.PreviousPeriodComplete);
        await db.AnalyticsCollection.ExecuteUpdateAsync(x => x.SetProperty(c => c.StartedAt, clock.Now.UtcDateTime));
        report = await service.Report("2026-10-23", "2026-10-23");
        Assert.IsFalse(report.PreviousPeriodComplete);
        Assert.IsNotNull(report.CollectionStartedAt);
    }

    [TestMethod]
    public async Task PresenceExpiresAndIsNotANewPageView()
    {
        await service.Presence(session, active: true);
        await service.Presence(session, active: true);
        var report = await service.Report("2026-10-23", "2026-10-23");
        Assert.AreEqual(1, report.Online);
        Assert.AreEqual(0, report.Current.Pages);
        clock.Now = clock.Now.AddSeconds(91);
        report = await service.Report("2026-10-23", "2026-10-23");
        Assert.AreEqual(0, report.Online);
    }

    [TestMethod]
    [DataRow("/dashboard/analytics")]
    [DataRow("/login")]
    [DataRow("/shared-note/secret/edit")]
    [DataRow("/news?secret=token")]
    [DataRow("https://external.example")]
    public async Task SensitiveAndInvalidPathsAreNeverRecorded(string path)
    {
        await service.Record(session, navigation, "page", "", "", path);
        Assert.AreEqual(0, await db.AnalyticsEvent.CountAsync());
    }

    [TestMethod]
    [DataRow("2026-10-24", "2026-10-24")]
    [DataRow("2026-06-01", "2026-10-23")]
    [DataRow("2026-10-23", "2026-10-22")]
    [DataRow("invalid", "2026-10-23")]
    public async Task InvalidOrExcessiveRangesAreRejected(string from, string to) =>
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.Report(from, to));

    [TestMethod]
    public async Task StorageFailureDoesNotInterruptContent()
    {
        await db.Database.ExecuteSqlRawAsync("DROP TABLE \"AnalyticsEvent\"");
        await service.Record(session, navigation, "article", "id", "title", "/news/topic/id");
    }

    [TestMethod]
    public void ReportsRequireDedicatedPermissionAndKnownBotsAreIgnored()
    {
        var attribute = typeof(AnalyticsController).GetMethod(nameof(AnalyticsController.Report))!
            .GetCustomAttributes(typeof(AuthorizeAttribute), true).Cast<AuthorizeAttribute>().Single();
        Assert.AreEqual("analytics.view", attribute.Policy);
        Assert.IsTrue(WebAnalyticsService.IsBot("Googlebot/2.1"));
        Assert.IsFalse(WebAnalyticsService.IsBot("Mozilla/5.0 Chrome/130.0 Safari/537.36"));
    }

    [TestMethod]
    public async Task FilterRecordsSuccessfulPublishedArticleOnly()
    {
        await Filter("News", "Detail", "/news/topic/article", new ApiResponse<RPNewsDto>(new RPNewsDto() { NewsId = "article", ShortTitle = "Bài viết", FlagActive = true }));
        await Filter("News", "Detail", "/news/topic/article", new ApiResponse<RPNewsDto>(new RPNewsDto() { NewsId = "article", ShortTitle = "Bài viết", FlagActive = true }));
        await Filter("News", "Detail", "/news/topic/draft", new ApiResponse<RPNewsDto>(new RPNewsDto() { NewsId = "draft", FlagActive = false }));
        await Filter("News", "Detail", "/news/topic/missing", new ApiResponse<RPNewsDto>("Not found"));
        await Filter("News", "Detail", "/dashboard/blog", new ApiResponse<RPNewsDto>(new RPNewsDto() { NewsId = "admin", FlagActive = true }));
        Assert.AreEqual(1, await db.AnalyticsEvent.CountAsync());
        Assert.AreEqual("article", (await db.AnalyticsEvent.SingleAsync()).Kind);
    }

    [TestMethod]
    public async Task FilterCountsPlaybackAndReelViewsButNotBrowseOrEmptySources()
    {
        var args = new Dictionary<string, object?> { ["slug"] = "film", ["server"] = 1, ["episode"] = "tap-1" };
        await Filter("MovieLibrary", "Browse", "/phim/film", new ApiResponse<MovieLibraryCatalogDto>(new MovieLibraryCatalogDto()), args);
        await Filter("MovieLibrary", "Playback", "/phim/film", new ApiResponse<MovieLibraryPlaybackDto>(new MovieLibraryPlaybackDto()), args);
        await Filter("MovieLibrary", "Playback", "/phim/film", new ApiResponse<MovieLibraryPlaybackDto>(new MovieLibraryPlaybackDto() { EmbedUrl = "https://player.example/secret" }), args);
        await Filter("Reel", "View", "/reels", new ApiResponse<ReelDto>(), new() { ["reelId"] = "reel-1" });
        await Filter("Reel", "View", "/reels", new ApiResponse<ReelDto>("Not found"), new() { ["reelId"] = "reel-2" });
        var rows = await db.AnalyticsEvent.ToListAsync();
        Assert.AreEqual(1, rows.Count);
        Assert.IsTrue(rows.All(x => x.Kind != "movie"));
        Assert.IsTrue(rows.All(x => !x.Path.Contains("secret") && !x.Title.Contains("secret")));
    }

    private async Task Filter(string controller, string action, string path, object response, Dictionary<string, object?>? args = null)
    {
        var http = new DefaultHttpContext();
        http.Request.Headers.UserAgent = "Mozilla/5.0 Chrome/130.0 Safari/537.36";
        http.Request.Headers["X-Blog-Session"] = session;
        http.Request.Headers["X-Blog-Navigation"] = navigation;
        http.Request.Headers["X-Blog-Page"] = path;
        var route = new RouteData(); route.Values["controller"] = controller; route.Values["action"] = action;
        var actionContext = new ActionContext(http, route, new ActionDescriptor());
        var executing = new ActionExecutingContext(actionContext, [], args ?? new Dictionary<string, object?>(), new object());
        var executed = new ActionExecutedContext(actionContext, [], new object()) { Result = new OkObjectResult(response) };
        await new AnalyticsFilter(service).OnActionExecutionAsync(executing, () => Task.FromResult(executed));
    }

    private class TestClock : TimeProvider
    {
        public DateTimeOffset Now { get; set; }
        public override DateTimeOffset GetUtcNow() => Now;
    }
}
