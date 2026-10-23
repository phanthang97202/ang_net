using angnet.Domain.Dtos;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Services;
using angnet.WebApi.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Npgsql;

namespace angnet.InfrastructureTests.Data.Services;

[TestClass]
public class UnifiedAnalyticsTests
{
    private SqliteConnection connection = null!;
    private AppDbContext db = null!;
    private Clock clock = null!;
    private MemoryCache cache = null!;
    private Reader legacy = null!;
    private WebAnalyticsService analytics = null!;
    private AnalyticsLegacyService history = null!;
    private static string Id() => Guid.NewGuid().ToString();

    [TestInitialize]
    public async Task Setup()
    {
        connection = new("Data Source=:memory:");
        await connection.OpenAsync();
        db = new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        clock = new(); cache = new(new MemoryCacheOptions()); legacy = new();
        db.AnalyticsCollection.Add(new() { Id = 1, StartedAt = clock.Now.AddDays(-2).UtcDateTime, UnifiedAt = clock.Now.UtcDateTime });
        await db.SaveChangesAsync();
        analytics = Service(db, clock, cache);
        history = new(db, () => legacy, clock, cache, NullLogger<AnalyticsLegacyService>.Instance);
    }

    [TestCleanup]
    public async Task Cleanup() { cache.Dispose(); await db.DisposeAsync(); await connection.DisposeAsync(); }

    private static WebAnalyticsService Service(AppDbContext context, TimeProvider time, IMemoryCache memory)
    {
        var health = new AnalyticsWriteHealth();
        return new(context, time, new(context, time), new(context, time, health, NullLogger<AnalyticsWriter>.Instance), health, memory);
    }

    [TestMethod]
    public async Task TabsShareOneSessionAndPassiveHeartbeatsDoNotExtendItsActivity()
    {
        var visitor = Id();
        Assert.IsTrue(await analytics.Record(Id(), Id(), "page", "", "", "/", visitorId: visitor));
        Assert.IsTrue(await analytics.Record(Id(), Id(), "page", "", "", "/news", visitorId: visitor));
        Assert.AreEqual(1, await db.WebsiteSession.CountAsync());
        Assert.AreEqual(1, await db.AnalyticsLedger.Select(x => x.SessionId).Distinct().CountAsync());
        clock.Now = clock.Now.AddMinutes(29);
        await analytics.Presence(Id(), visitor);
        Assert.AreEqual(1, (await analytics.PublicStats()).OnlineCount);
        clock.Now = clock.Now.AddMinutes(1);
        await analytics.Presence(Id(), visitor);
        Assert.AreEqual(0, (await analytics.PublicStats()).OnlineCount);
        Assert.AreEqual(1, await db.WebsiteSession.CountAsync());
        await analytics.Record(Id(), Id(), "page", "", "", "/", visitorId: visitor);
        Assert.AreEqual(2, await db.WebsiteSession.CountAsync());
        Assert.AreEqual(1, await db.WebsiteSession.CountAsync(x => x.IsCurrent));
    }

    [TestMethod]
    public async Task MidnightPageDoesNotStartAnotherSessionOrInflateDailyTotals()
    {
        clock.Now = DateTimeOffset.Parse("2026-10-22T16:59:50Z");
        var visitor = Id();
        await analytics.Record(Id(), Id(), "page", "", "", "/", visitorId: visitor);
        clock.Now = clock.Now.AddSeconds(20);
        await analytics.Record(Id(), Id(), "page", "", "", "/news", visitorId: visitor);
        clock.Now = clock.Now.AddSeconds(1);
        var report = await analytics.Report("2026-10-22", "2026-10-23");
        Assert.AreEqual(1, report.Current.Sessions);
        Assert.AreEqual(1, report.Points[0].Sessions);
        Assert.AreEqual(0, report.Points[1].Sessions);
        Assert.AreEqual(1, report.Points[1].Pages);
    }

    [TestMethod]
    public async Task LegacyCountersAreCapturedOnceAndFooterAndDashboardAgreeWithoutRedis()
    {
        legacy.Values = [new() { Period = "", Value = 1200 }, new() { Period = "2026-10", Value = 80 }];
        Assert.IsTrue(await history.CaptureWebsite());
        legacy.Fail = true;
        Assert.IsTrue(await history.CaptureWebsite());
        Assert.AreEqual(1, legacy.Reads);
        clock.Now = clock.Now.AddSeconds(1);
        await analytics.Record(Id(), Id(), "page", "", "", "/", visitorId: Id());
        clock.Now = clock.Now.AddSeconds(1);
        var footer = await analytics.PublicStats();
        var report = await analytics.Report("2026-10-23", "2026-10-23");
        Assert.IsTrue(footer.LegacyMerged);
        Assert.AreEqual(1201L, footer.TotalCount);
        Assert.AreEqual(1L, footer.MonthCount); // UTC-month legacy totals cannot be recast as Vietnam sessions.
        Assert.AreEqual(footer.TotalCount, report.Lifetime.TotalVisits);
        Assert.AreEqual(1, report.Current.Sessions);
    }

    [TestMethod]
    public async Task LateSnapshotIsKeptSeparateRatherThanAddingPossibleOverlap()
    {
        await analytics.Record(Id(), Id(), "page", "", "", "/", visitorId: Id());
        legacy.Values = [new() { Period = "", Value = 1200 }];
        await history.CaptureWebsite();
        var footer = await analytics.PublicStats();
        Assert.IsFalse(footer.LegacyMerged);
        Assert.AreEqual(1L, footer.TotalCount);
        Assert.AreEqual(1200L, (await analytics.Lifetime()).LegacyWebsite.Single().Value);
        Assert.AreEqual(1200L, (await history.Preview()).BalanceConflicts.Single().OriginalValue);
    }

    [TestMethod]
    public async Task RedisOutageDoesNotBlockDatabaseTracking()
    {
        legacy.Fail = true;
        Assert.IsFalse(await history.CaptureWebsite());
        Assert.IsTrue(await analytics.Record(Id(), Id(), "page", "", "", "/", visitorId: Id()));
        Assert.AreEqual(1L, (await analytics.PublicStats()).TotalCount);
        Assert.IsFalse((await history.Preview()).RedisAvailable);
    }

    [TestMethod]
    public async Task ReportsAndPreviewNeverReadRetiredSources()
    {
        var start = (await db.AnalyticsCollection.SingleAsync()).StartedAt;
        db.AuditTrail.AddRange(Audit(start.AddMinutes(-1)), Audit(start.AddMinutes(1)));
        db.AnalyticsEvent.Add(new() { EventId = new string('A', 64), OccurredAt = start.AddMinutes(1), LocalHour = "2026-10-21T11", Kind = "movie", ContentId = "test-film", Title = "Film", SessionId = Id(), Path = "/phim/test-film" });
        await db.SaveChangesAsync();
        var plan = await history.Preview();
        Assert.AreEqual(0L, plan.AuditBeforeAnalytics);
        Assert.AreEqual(0L, plan.AuditOverlappingAnalytics);
        legacy.Values = [new() { Period = "", Value = 0 }];
        await history.Import(plan.PlanToken, default);
        await history.Import((await history.Preview()).PlanToken, default);
        Assert.AreEqual(0, await db.MovieViewLog.CountAsync());
        Assert.AreEqual(2, await db.AuditTrail.CountAsync());
        Assert.AreEqual(0L, (await analytics.Lifetime()).MovieOpens);
        await history.Maintain(default);
        cache.Remove(WebAnalyticsService.SummaryCache);
        Assert.AreEqual(0, await db.MovieViewLog.CountAsync());
        Assert.AreEqual(0L, (await analytics.Lifetime()).MovieOpens);
        var report = await analytics.Report("2026-10-20", "2026-10-23");
        Assert.AreEqual(0, report.Current.Movies);
        Assert.AreEqual(0, report.TopMovies.Count);
    }

    [TestMethod]
    public async Task ImportRejectsChangedSourceBeforeWritingAnything()
    {
        var plan = await history.Preview();
        db.AnalyticsLedger.Add(new() { EventId = Id(), Kind = "session", RecordType = "balance", Quantity = 42, Included = false, OccurredAt = clock.Now.UtcDateTime }); await db.SaveChangesAsync();
        await Assert.ThrowsExceptionAsync<InvalidOperationException>(() => history.Import(plan.PlanToken, default));
        Assert.AreEqual(0, await db.MovieViewLog.CountAsync());
    }

    [TestMethod]
    public async Task CounterFailureRollsBackItsEventAndSessionAndReportsWriteFailure()
    {
        await db.Database.ExecuteSqlRawAsync("DROP TABLE \"Reel\"");
        var health = new AnalyticsWriteHealth();
        var writer = new AnalyticsWriter(db, clock, health, NullLogger<AnalyticsWriter>.Instance);
        var actual = new WebAnalyticsService(db, clock, new(db, clock), writer, health, cache);
        Assert.IsFalse(await actual.Record(Id(), Id(), "reel", "missing", "", "/reels", visitorId: Id()));
        Assert.AreEqual(0, await db.AnalyticsLedger.CountAsync());
        Assert.AreEqual(0, await db.WebsiteSession.CountAsync());
        Assert.AreEqual(1L, health.Failures);
        Assert.AreEqual(clock.Now.UtcDateTime, health.LastFailureAt);
    }

    [TestMethod]
    public async Task MovieCursorHandlesEqualTimesWithoutRepeatsAndRejectsMalformedCursor()
    {
        for (var n = 1; n <= 5; n++) db.AnalyticsLedger.Add(new()
        {
            EventId = n.ToString("X64"), Kind = "movie", OccurredAt = clock.Now.UtcDateTime, LocalHour = "2026-10-23T11", ContentId = "film", Title = "Film", ActorName = "Owner", Source = "playback"
        });
        await db.SaveChangesAsync();
        var controller = new MovieViewLogsController(db, clock);
        static MovieViewLogPageDto Data(IActionResult result) => ((ApiResponse<MovieViewLogPageDto>)((OkObjectResult)result).Value!).Data!;
        var first = Data(await controller.Search("2026-10-23", "2026-10-23", pageSize: 2));
        var second = Data(await controller.Search("2026-10-23", "2026-10-23", pageSize: 2, cursor: first.NextCursor));
        var third = Data(await controller.Search("2026-10-23", "2026-10-23", pageSize: 2, cursor: second.NextCursor));
        Assert.AreEqual(5, first.Items.Concat(second.Items).Concat(third.Items).Select(x => x.EventId).Distinct().Count());
        Assert.IsNull(third.NextCursor);
        Assert.IsInstanceOfType<BadRequestResult>(await controller.Search("2026-10-23", "2026-10-23", cursor: "bad"));
        Assert.AreEqual(0, Data(await controller.Search("2026-10-23", "2026-10-23", "missing")).Items.Count);
    }

    private static AuditTrailModel Audit(DateTime at) => new()
    {
        RecordId = "phimapi:test-film", RequestUrl = "/api/Movie/Library/test-film/playback", ChangedDTime = at, ChangedBy = "Owner",
        Description = "Mở xem phim \"Film\" (test-film) · Tập: Tập 1 (tap-1) · Nguồn: Server (1) · UserId: owner"
    };
    private sealed class Clock : TimeProvider
    {
        public DateTimeOffset Now = DateTimeOffset.Parse("2026-10-23T04:00:00Z");
        public override DateTimeOffset GetUtcNow() => Now;
    }
    private sealed class Reader : ILegacyVisitReader
    {
        public bool Fail; public int Reads;
        public List<AnalyticsLegacyValueDto> Values = [];
        public Task<List<AnalyticsLegacyValueDto>> Read(CancellationToken ct) { Reads++; if (Fail) throw new IOException("Unavailable"); return Task.FromResult(Values); }
    }

    [TestMethod]
    public async Task Postgres_MigrationPreservesHistoryAndConcurrentTabsDeduplicate()
    {
        var cs = Environment.GetEnvironmentVariable("ANGNET_ANALYTICS_TEST_DB");
        if (string.IsNullOrEmpty(cs)) Assert.Inconclusive("Set ANGNET_ANALYTICS_TEST_DB to run isolated PostgreSQL migration/concurrency checks.");
        var schema = "analytics_test_" + Guid.NewGuid().ToString("N");
        await using var admin = new NpgsqlConnection(cs); await admin.OpenAsync();
        await using (var create = new NpgsqlCommand($"CREATE SCHEMA \"{schema}\"", admin)) await create.ExecuteNonQueryAsync();
        var scoped = new NpgsqlConnectionStringBuilder(cs) { SearchPath = schema }.ConnectionString;
        try
        {
            await using var sql = new NpgsqlConnection(scoped); await sql.OpenAsync();
            await using (var baseline = new NpgsqlCommand("""
                CREATE TABLE "SysPermission" ("PermissionCode" text, "PermissionNameVi" text, "PermissionNameEn" text, "Module" text, "ModuleNameVi" text, "ModuleNameEn" text, "DescriptionVi" text, "DescriptionEn" text, "SortOrder" integer, "FlagActive" boolean, "CreatedBy" text, "UpdatedBy" text, "CreatedDTime" timestamptz, "UpdatedDTime" timestamptz);
                CREATE TABLE "News" ("NewsId" text PRIMARY KEY, "ShortTitle" text, "ViewCount" integer);
                CREATE TABLE "Reel" ("ReelId" text PRIMARY KEY, "Caption" text, "ViewCount" integer);
                CREATE TABLE "AuditTrail" ("AuditTrailId" integer PRIMARY KEY,"RecordId" text,"RequestUrl" text,"Description" text,"ChangedDTime" timestamptz,"ChangedBy" text);
                INSERT INTO "News" VALUES ('article', 'Article', 40);
                INSERT INTO "Reel" VALUES ('reel', 'Reel', 20);
                """, sql)) await baseline.ExecuteNonQueryAsync();
            async Task Migrate(string name)
            {
                var assembly = typeof(AppDbContext).Assembly;
                using var reader = new StreamReader(assembly.GetManifestResourceStream(assembly.GetManifestResourceNames().Single(x => x.EndsWith(name)))!);
                await using var migration = await sql.BeginTransactionAsync();
                await using var command = new NpgsqlCommand(await reader.ReadToEndAsync(), sql, migration); await command.ExecuteNonQueryAsync();
                await migration.CommitAsync();
            }
            await Migrate("0061_WebAnalytics.sql");
            await using (var seed = new NpgsqlCommand("""
                INSERT INTO "AnalyticsEvent" VALUES (repeat('A',64), now() - interval '1 day', '2026-10-22T11', '11111111-1111-1111-1111-111111111111', 'page', '', '', '/');
                INSERT INTO "AnalyticsEvent" VALUES (repeat('B',64), now() - interval '1 day', '2026-10-22T11', '11111111-1111-1111-1111-111111111111', 'movie', 'film', 'Film', '/phim/film');
                """, sql)) await seed.ExecuteNonQueryAsync();
            await Migrate("0062_UnifiedWebsiteAnalytics.sql");
            await using (var history = new NpgsqlCommand("""
                INSERT INTO "AuditTrail" VALUES (1,'phimapi:old-film','/api/Movie/Library/old-film/playback','Mở xem phim "Old Film" (old-film) · Tập: One (ep-1) · Nguồn: Vietsub (1) · UserId: owner',now()-interval '10 days','Owner');
                INSERT INTO "AnalyticsLegacySnapshot" VALUES ('website:total','website','','','Redis.VisitStats','',1200,now(),true);
                """, sql)) await history.ExecuteNonQueryAsync();
            await Migrate("0063_CanonicalAnalyticsLedger.sql");
            AppDbContext Open() => new(new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(scoped, x => x.EnableRetryOnFailure()).Options);
            await using var check = Open();
            Assert.AreEqual(2, await check.AnalyticsEvent.CountAsync());
            Assert.AreEqual(1, await check.WebsiteSession.CountAsync());
            Assert.AreEqual(1, await check.MovieViewLog.CountAsync());
            Assert.AreEqual(1260L, await check.AnalyticsLegacySnapshot.SumAsync(x => x.Value));
            var ledgerBefore = await check.AnalyticsLedger.CountAsync();
            await Migrate("0063_CanonicalAnalyticsLedger.sql");
            Assert.AreEqual(ledgerBefore, await check.AnalyticsLedger.CountAsync());
            var visitor = Id(); var nav = Id();
            var attempts = await Task.WhenAll(Enumerable.Range(0, 12).Select(async _ =>
            {
                await using var context = Open(); using var memory = new MemoryCache(new MemoryCacheOptions());
                return await Service(context, TimeProvider.System, memory).Record(Id(), nav, "article", "article", "Article", "/news/topic/article", visitorId: visitor);
            }));
            Assert.IsTrue(attempts.All(x => x));
            Assert.AreEqual(1, await check.WebsiteSession.CountAsync(x => x.VisitorId == visitor));
            Assert.AreEqual(1, await check.AnalyticsLedger.CountAsync(x => x.Kind == "article" && x.RecordType == "event"));
            Assert.AreEqual(0, await check.AnalyticsEvent.CountAsync(x => x.Kind == "article"));
            Assert.AreEqual(41, await check.News.Where(x => x.NewsId == "article").Select(x => x.ViewCount).SingleAsync());
            using var reportMemory = new MemoryCache(new MemoryCacheOptions());
            var actual = Service(check, TimeProvider.System, reportMemory);
            var day = DateTime.UtcNow.AddHours(7).ToString("yyyy-MM-dd");
            Assert.AreEqual(1, (await actual.Report(day, day)).TopArticles.Single().Views);
            Assert.AreEqual(2L, (await actual.Lifetime()).MovieOpens);
            await using (var rogue = new NpgsqlCommand("UPDATE \"News\" SET \"ViewCount\"=999 WHERE \"NewsId\"='article'", sql)) await rogue.ExecuteNonQueryAsync();
            Assert.AreEqual(41, await check.News.Where(x => x.NewsId == "article").Select(x => x.ViewCount).SingleAsync());
            var filmHistory = (ApiResponse<MovieViewLogPageDto>)((OkObjectResult)await new MovieViewLogsController(check, TimeProvider.System).Search(DateTime.UtcNow.AddDays(-12).ToString("yyyy-MM-dd"), day)).Value!;
            Assert.AreEqual(2, filmHistory.Data!.Items.Count);
            var importedAudit = filmHistory.Data.Items.Single(x => x.MovieSlug == "old-film");
            Assert.AreEqual("owner", importedAudit.UserId); Assert.AreEqual("ep-1", importedAudit.EpisodeSlug);
            var auditCursor = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{importedAudit.OccurredAt.Ticks}:{importedAudit.EventId}"));
            Assert.IsInstanceOfType<OkObjectResult>(await new MovieViewLogsController(check, TimeProvider.System).Search(DateTime.UtcNow.AddDays(-12).ToString("yyyy-MM-dd"), day, cursor: auditCursor));
        }
        finally
        {
            // Only this test's newly generated schema is removed, never an existing database.
            await using var drop = new NpgsqlCommand($"DROP SCHEMA \"{schema}\" CASCADE", admin); await drop.ExecuteNonQueryAsync();
        }
    }
}
