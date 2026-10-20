using System.Security.Claims;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Services;
using angnet.WebApi.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using Npgsql;

namespace angnet.InfrastructureTests.Data.Services;

[TestClass]
public class MovieWatchProgressTests
{
    private SqliteConnection connection = null!;
    private AppDbContext db = null!;
    private Mock<IMovieLibraryService> library = null!;
    private MovieWatchProgressService service = null!;
    private static MovieWatchProgressSaveDto Episode(string slug, int server = 3) => new() { ServerId = server, EpisodeSlug = slug };
    private static MovieLibraryDetailDto Movie() => new()
    {
        Slug = "test-film", Servers = [new() { Id = 3, Name = "Vietsub", Episodes = [
            new() { Slug = "tap-1", Name = "Tập 1", HasSource = true },
            new() { Slug = "tap-51", Name = "Tập 51", HasSource = true },
            new() { Slug = "pending", Name = "Tập 52", HasSource = false }
        ] }]
    };

    [TestInitialize]
    public async Task Setup()
    {
        connection = new("Data Source=:memory:");
        await connection.OpenAsync();
        db = new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        db.Users.AddRange(new AppUser { Id = "owner", FlagActive = true }, new AppUser { Id = "other", FlagActive = true });
        await db.SaveChangesAsync();
        library = new(MockBehavior.Strict);
        library.Setup(x => x.Detail(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(Movie);
        service = new(db, library.Object);
    }

    [TestCleanup]
    public async Task Cleanup() { await db.DisposeAsync(); await connection.DisposeAsync(); }

    [TestMethod]
    public async Task Save_OverwritesOneRowAndSurvivesANewDbContext()
    {
        Assert.IsNull(await service.Get("owner", "test-film", default));
        await service.Save("owner", "test-film", Episode("tap-1"), default);
        var saved = await service.Save("owner", "test-film", Episode("tap-51"), default);
        Assert.AreEqual("Tập 51", saved.EpisodeName);
        Assert.AreEqual("Vietsub", saved.ServerName);
        Assert.AreEqual(1, await db.MovieWatchProgress.CountAsync());
        await using var reloadedDb = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        var reloaded = await new MovieWatchProgressService(reloadedDb, library.Object).Get("owner", "test-film", default);
        Assert.AreEqual("tap-51", reloaded!.EpisodeSlug);
        Assert.AreEqual(3, reloaded.ServerId);
        Assert.IsTrue(reloaded.UpdatedAt > DateTime.UtcNow.AddMinutes(-1));
    }

    [TestMethod]
    public async Task Progress_IsPrivateAndIndependentAcrossUsersAndMovies()
    {
        await service.Save("owner", "test-film", Episode("tap-51"), default);
        Assert.IsNull(await service.Get("other", "test-film", default));
        await service.Save("other", "test-film", Episode("tap-1"), default);
        await service.Save("owner", "another-film", Episode("tap-1"), default);
        Assert.AreEqual("tap-51", (await service.Get("owner", "test-film", default))!.EpisodeSlug);
        Assert.AreEqual("tap-1", (await service.Get("other", "test-film", default))!.EpisodeSlug);
        Assert.AreEqual(3, await db.MovieWatchProgress.CountAsync());
    }

    [TestMethod]
    public async Task Save_AllowsRewatchingAnEarlierEpisodeInsteadOfKeepingTheHighestNumber()
    {
        await service.Save("owner", "test-film", Episode("tap-51"), default);
        await service.Save("owner", "test-film", Episode("tap-1"), default);
        Assert.AreEqual("tap-1", (await service.Get("owner", "test-film", default))!.EpisodeSlug);
        Assert.AreEqual(1, await db.MovieWatchProgress.CountAsync());
    }

    [TestMethod]
    public async Task Save_RejectsInvalidOrUnplayableEpisodesWithoutChangingProgress()
    {
        await service.Save("owner", "test-film", Episode("tap-1"), default);
        await Assert.ThrowsExceptionAsync<KeyNotFoundException>(() => service.Save("owner", "test-film", Episode("pending"), default));
        await Assert.ThrowsExceptionAsync<KeyNotFoundException>(() => service.Save("owner", "test-film", Episode("missing"), default));
        await Assert.ThrowsExceptionAsync<KeyNotFoundException>(() => service.Save("owner", "test-film", Episode("tap-51", 100), default));
        Assert.AreEqual("tap-1", (await service.Get("owner", "test-film", default))!.EpisodeSlug);
    }

    [TestMethod]
    public async Task Validation_RejectsMissingOwnerAndMalformedInputsBeforeProviderLookup()
    {
        library.Invocations.Clear();
        await Assert.ThrowsExceptionAsync<UnauthorizedAccessException>(() => service.Save("", "test-film", Episode("tap-1"), default));
        await Assert.ThrowsExceptionAsync<UnauthorizedAccessException>(() => service.Get("", "test-film", default));
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.Save("owner", "../film", Episode("tap-1"), default));
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.Save("owner", "test-film", Episode("tap-1", -1), default));
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.Save("owner", "test-film", Episode(new string('a', 201)), default));
        library.VerifyNoOtherCalls();
    }

    [TestMethod]
    public async Task ASlowOlderSave_CannotOverwriteANewerProgressUpdate()
    {
        var slow = new TaskCompletionSource<MovieLibraryDetailDto>(TaskCreationOptions.RunContinuationsAsynchronously);
        library.SetupSequence(x => x.Detail("test-film", default)).Returns(slow.Task).ReturnsAsync(Movie());
        var older = service.Save("owner", "test-film", Episode("tap-1"), default);
        await Task.Delay(10);
        await service.Save("owner", "test-film", Episode("tap-51"), default);
        slow.SetResult(Movie());
        await older;
        Assert.AreEqual("tap-51", (await service.Get("owner", "test-film", default))!.EpisodeSlug);
        Assert.AreEqual(1, await db.MovieWatchProgress.CountAsync());
    }

    [TestMethod]
    public async Task OwnerDeletion_CascadesProgressAndModelHasTheExpectedKey()
    {
        var entity = db.Model.FindEntityType(typeof(MovieWatchProgressModel))!;
        CollectionAssert.AreEqual(new[] { "UserId", "Provider", "MovieSlug" }, entity.FindPrimaryKey()!.Properties.Select(x => x.Name).ToArray());
        Assert.AreEqual(DeleteBehavior.Cascade, entity.GetForeignKeys().Single().DeleteBehavior);
        await service.Save("owner", "test-film", Episode("tap-1"), default);
        db.Users.Remove((await db.Users.FindAsync("owner"))!);
        await db.SaveChangesAsync();
        Assert.AreEqual(0, await db.MovieWatchProgress.CountAsync());
    }

    [TestMethod]
    public async Task Controller_UsesOnlyTheAuthenticatedOwnerAndRequiresMoviePermission()
    {
        var progress = new Mock<IMovieWatchProgressService>(MockBehavior.Strict);
        var data = Episode("tap-51");
        progress.Setup(x => x.Save("owner", "test-film", data, default)).ReturnsAsync(new MovieWatchProgressDto());
        var controller = new MovieWatchProgressController(progress.Object, Mock.Of<ILogger<MovieWatchProgressController>>())
        { ControllerContext = Context("owner") };
        Assert.IsInstanceOfType(await controller.Save("test-film", data, default), typeof(OkObjectResult));
        progress.VerifyAll();
        Assert.AreEqual("movie.view", typeof(MovieWatchProgressController).GetCustomAttributes(typeof(AuthorizeAttribute), false).Cast<AuthorizeAttribute>().Single().Policy);
        controller.ControllerContext = Context(null);
        Assert.IsInstanceOfType(await controller.Save("test-film", data, default), typeof(UnauthorizedResult));
        progress.Verify(x => x.Save(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<MovieWatchProgressSaveDto>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [TestMethod]
    public async Task Detail_OnlyAttachesTheCurrentUsersProgress()
    {
        var wishlist = new Mock<IMovieWishlistService>();
        wishlist.Setup(x => x.MarkSaved(It.IsAny<string>(), It.IsAny<IEnumerable<MovieLibraryItemDto>>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        await service.Save("owner", "test-film", Episode("tap-51"), default);
        var controller = new MovieLibraryController(library.Object, wishlist.Object, service, Mock.Of<ILogger<MovieLibraryController>>())
        { ControllerContext = Context("owner") };
        var own = (OkObjectResult)await controller.Detail("test-film", default);
        Assert.AreEqual("tap-51", ((ApiResponse<MovieLibraryDetailDto>)own.Value!).Data.WatchProgress!.EpisodeSlug);
        controller.ControllerContext = Context("other");
        var other = (OkObjectResult)await controller.Detail("test-film", default);
        Assert.IsNull(((ApiResponse<MovieLibraryDetailDto>)other.Value!).Data.WatchProgress);
    }

    [TestMethod]
    public void Migration_IsEmbeddedForAutomaticDeployment()
    {
        Assert.IsTrue(typeof(AppDbContext).Assembly.GetManifestResourceNames().Any(x => x.EndsWith("0058_TienTrinhXemPhim.sql", StringComparison.Ordinal)));
    }

    [TestMethod]
    public async Task Postgres_MigrationAndUpsertPersistPrivateProgress()
    {
        var connectionString = Environment.GetEnvironmentVariable("ANGNET_MOVIE_TEST_DB");
        if (string.IsNullOrWhiteSpace(connectionString))
            Assert.Inconclusive("Set ANGNET_MOVIE_TEST_DB to run the isolated PostgreSQL check.");
        var schema = "movie_progress_test_" + Guid.NewGuid().ToString("N");
        await using var admin = new NpgsqlConnection(connectionString);
        await admin.OpenAsync();
        await using (var create = new NpgsqlCommand($"CREATE SCHEMA \"{schema}\"", admin))
            await create.ExecuteNonQueryAsync();
        try
        {
            var scopedConnection = new NpgsqlConnectionStringBuilder(connectionString) { SearchPath = schema }.ConnectionString;
            await using var scoped = new NpgsqlConnection(scopedConnection);
            await scoped.OpenAsync();
            await using (var users = new NpgsqlCommand("""
                CREATE TABLE "AspNetUsers" ("Id" text PRIMARY KEY);
                INSERT INTO "AspNetUsers" ("Id") VALUES ('owner'), ('other');
                """, scoped))
                await users.ExecuteNonQueryAsync();
            var assembly = typeof(AppDbContext).Assembly;
            await using var stream = assembly.GetManifestResourceStream(assembly.GetManifestResourceNames()
                .Single(x => x.EndsWith("0058_TienTrinhXemPhim.sql", StringComparison.Ordinal)))!;
            using var reader = new StreamReader(stream);
            await using (var migration = new NpgsqlCommand(await reader.ReadToEndAsync(), scoped))
                await migration.ExecuteNonQueryAsync();
            await using var postgres = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(scopedConnection).Options);
            var actual = new MovieWatchProgressService(postgres, library.Object);
            await actual.Save("owner", "test-film", Episode("tap-1"), default);
            await actual.Save("owner", "test-film", Episode("tap-51"), default);
            Assert.AreEqual(1, await postgres.MovieWatchProgress.CountAsync());
            Assert.AreEqual("tap-51", (await actual.Get("owner", "test-film", default))!.EpisodeSlug);
            Assert.IsNull(await actual.Get("other", "test-film", default));
        }
        finally
        {
            // Only the random schema created by this test is ever removed.
            await using var drop = new NpgsqlCommand($"DROP SCHEMA \"{schema}\" CASCADE", admin);
            await drop.ExecuteNonQueryAsync();
        }
    }

    private static ControllerContext Context(string? userId) => new()
    {
        HttpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(userId == null ? [] : new[] { new Claim(ClaimTypes.NameIdentifier, userId) }, "test"))
        }
    };
}
