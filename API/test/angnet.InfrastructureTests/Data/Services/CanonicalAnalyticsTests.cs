using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;

namespace angnet.InfrastructureTests.Data.Services;

[TestClass]
public class CanonicalAnalyticsTests
{
    private SqliteConnection connection = null!;
    private AppDbContext db = null!;
    private WebAnalyticsService service = null!;
    private Clock clock = null!;
    private AnalyticsWriteHealth health = null!;
    private MemoryCache cache = null!;
    private AnalyticsWriter writer = null!;
    [TestInitialize]
    public async Task Setup()
    {
        connection = new("Data Source=:memory:"); await connection.OpenAsync();
        db = new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync(); clock = new(); health = new(); cache = new(new MemoryCacheOptions());
        writer = new(db, clock, health, NullLogger<AnalyticsWriter>.Instance);
        service = new(db, clock, new(db, clock), writer, health, cache);
        db.AnalyticsCollection.Add(new() { Id = 1, StartedAt = clock.Now.AddDays(-1).UtcDateTime, UnifiedAt = clock.Now.AddDays(-1).UtcDateTime, CanonicalAt = clock.Now.UtcDateTime });
        await db.SaveChangesAsync();
    }
    [TestCleanup] public async Task Cleanup() { cache.Dispose(); await db.DisposeAsync(); await connection.DisposeAsync(); }
    private AnalyticsLedgerModel Balance(string kind, long quantity, string content = "") => new()
    {
        EventId = Guid.NewGuid().ToString(), Kind = kind, RecordType = "balance", Quantity = quantity,
        OriginalValue = quantity, ContentId = content, OccurredAt = clock.Now.UtcDateTime,
    };
    [TestMethod]
    public async Task OpeningBalancesAreLifetimeOnlyAndPublicCountersShareLedger()
    {
        db.AnalyticsLedger.AddRange(Balance("article", 40, "article"), Balance("reel", 20, "reel"), Balance("session", 1000));
        await db.SaveChangesAsync();
        Assert.IsTrue(await service.Record(Guid.NewGuid().ToString(), Guid.NewGuid().ToString(), "article", "article", "Title", "/news/topic/article"));
        clock.Now = clock.Now.AddSeconds(1);
        Assert.AreEqual(41, await service.ArticleCounter("article"));
        var report = await service.Report("2026-10-23", "2026-10-23");
        Assert.AreEqual(1, report.Current.Articles);
        Assert.AreEqual(1, report.Points.Sum(x => x.Articles));
        Assert.AreEqual(41L, report.Lifetime.ArticleViews);
        Assert.AreEqual(20L, report.Lifetime.ReelViews);
        Assert.AreEqual(1001L, report.Lifetime.TotalVisits);
        Assert.AreEqual(1L, report.Lifetime.MonthVisits);
        Assert.AreEqual(report.Lifetime.TotalVisits, (await service.PublicStats()).TotalCount);
    }
    [TestMethod]
    public async Task ArchivedCountersAndLogsCannotChangeReportsOrPreview()
    {
        db.AnalyticsLegacySnapshot.Add(new() { SnapshotId = "old", Kind = "website", Value = 99999, CanMerge = true, CapturedAt = clock.Now.UtcDateTime });
        db.MovieViewLog.Add(new() { EventId = "old-movie", MovieSlug = "ignored", MovieTitle = "Ignored", OccurredAt = clock.Now.UtcDateTime });
        db.AnalyticsEvent.Add(new() { EventId = "old-page", Kind = "page", OccurredAt = clock.Now.UtcDateTime });
        await db.SaveChangesAsync(); clock.Now = clock.Now.AddSeconds(1);
        var report = await service.Report("2026-10-23", "2026-10-23");
        Assert.AreEqual(0, report.Current.Pages); Assert.AreEqual(0, report.Current.Movies);
        Assert.AreEqual(0L, report.Lifetime.TotalVisits); Assert.AreEqual(0L, report.Lifetime.MovieOpens);
        var reader = new Reader { Throw = true };
        var history = new AnalyticsLegacyService(db, () => reader, clock, cache, NullLogger<AnalyticsLegacyService>.Instance);
        Assert.AreEqual(0L, (await history.Preview()).ExistingMovieRows); Assert.AreEqual(0, reader.Reads);
    }
    [TestMethod]
    public async Task OldMovieFactsNeverClaimContinuousCoverage()
    {
        db.AnalyticsLedger.Add(new() { EventId = "historical", Kind = "movie", ContentId = "film", OccurredAt = clock.Now.AddDays(-20).UtcDateTime, LocalHour = "2026-10-03T11" });
        await db.SaveChangesAsync();
        var report = await service.Report("2026-10-01", "2026-10-07");
        Assert.AreEqual(1, report.Current.Movies);
        Assert.AreEqual("partial", report.DataQuality["Movies"].Current);
        Assert.IsFalse(report.DataQuality["Movies"].CanCompare);
        Assert.AreEqual((await db.AnalyticsCollection.SingleAsync()).StartedAt, report.Coverage["Movies"]);
    }
    [TestMethod]
    public async Task EmptyLegacyResponseIsNotLatchedAsSuccessfulImport()
    {
        var reader = new Reader();
        var history = new AnalyticsLegacyService(db, () => reader, clock, cache, NullLogger<AnalyticsLegacyService>.Instance);
        Assert.IsFalse(await history.CaptureWebsite());
        Assert.IsFalse((await history.Preview()).RedisSnapshotExists);
        reader.Values = [new() { Period = "", Value = 12 }];
        Assert.IsTrue(await history.CaptureWebsite());
        Assert.AreEqual(2, reader.Reads);
        Assert.IsTrue((await history.Preview()).RedisSnapshotExists);
    }
    [TestMethod]
    public async Task FailedWritesPersistGapOnRecoveryAndComparisonStaysDisabledAfterRestart()
    {
        Assert.IsFalse(await writer.Write(ct => db.Database.ExecuteSqlRawAsync("INSERT INTO missing_table VALUES (1)", ct)));
        clock.Now = clock.Now.AddSeconds(5);
        Assert.IsTrue(await service.Record(Guid.NewGuid().ToString(), Guid.NewGuid().ToString(), "page", "", "", "/"));
        Assert.AreEqual(1, await db.AnalyticsGap.CountAsync());
        var freshHealth = new AnalyticsWriteHealth();
        var fresh = new WebAnalyticsService(db, clock, new(db, clock), new(db, clock, freshHealth, NullLogger<AnalyticsWriter>.Instance), freshHealth, cache);
        clock.Now = clock.Now.AddSeconds(1);
        var report = await fresh.Report("2026-10-23", "2026-10-23");
        Assert.AreEqual(1L, report.WriteFailures);
        Assert.IsTrue(report.Points.Any(x => x.HasGap));
        Assert.AreEqual("partial", report.DataQuality["Pages"].Current);
        Assert.IsFalse(report.DataQuality["Pages"].CanCompare);
    }
    [TestMethod]
    public async Task DatabaseRejectsAggregatesDisguisedAsDatedEvents()
    {
        db.AnalyticsLedger.Add(new() { EventId = "invalid-grain", Kind = "page", Quantity = 42, OccurredAt = clock.Now.UtcDateTime });
        await Assert.ThrowsExceptionAsync<DbUpdateException>(() => db.SaveChangesAsync());
    }
    private sealed class Clock : TimeProvider
    {
        public DateTimeOffset Now = DateTimeOffset.Parse("2026-10-23T04:00:00Z");
        public override DateTimeOffset GetUtcNow() => Now;
    }
    private sealed class Reader : ILegacyVisitReader
    {
        public int Reads; public bool Throw;
        public List<angnet.Domain.Dtos.AnalyticsLegacyValueDto> Values = [];
        public Task<List<angnet.Domain.Dtos.AnalyticsLegacyValueDto>> Read(CancellationToken ct)
        { Reads++; if (Throw) throw new IOException(); return Task.FromResult(Values); }
    }
}
