using System.Security.Claims;
using System.Text.Json;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace angnet.InfrastructureTests.Data.Services;

[TestClass]
public class PersonalNoteTests
{
    private SqliteConnection connection = null!;
    private AppDbContext db = null!;
    private PersonalNoteService service = null!;
    private const string Document = """{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Ý tưởng riêng tư"}]}]}""";
    private static ClaimsPrincipal User(string id = "owner") => new(new ClaimsIdentity(new[]
    { new Claim(ClaimTypes.NameIdentifier, id) }, "test"));
    private static PersonalNoteSaveDto Data(string title = "My note", int version = 0, string json = Document) => new()
    { Title = title, ContentJson = json, Version = version };

    [TestInitialize]
    public async Task Setup()
    {
        connection = new("Data Source=:memory:"); await connection.OpenAsync();
        db = new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        db.Users.AddRange(new AppUser { Id = "owner", FlagActive = true }, new AppUser { Id = "other", FlagActive = true });
        await db.SaveChangesAsync(); service = new(db);
    }
    [TestCleanup] public async Task Cleanup() { await db.DisposeAsync(); await connection.DisposeAsync(); }

    [TestMethod]
    public async Task Notes_ArePrivateForListDetailUpdateAndDeleteEvenWhenIdIsKnown()
    {
        string id = Guid.NewGuid().ToString();
        var created = await service.Save(User(), id, Data("  Ghi chú của tôi  "));
        Assert.AreEqual("Ghi chú của tôi", created!.Title); Assert.AreEqual(1, created.Version);
        Assert.AreEqual(Document, (await service.Get(User(), id))!.ContentJson);
        Assert.AreEqual(1, (await service.List(User(), null, 20, null)).DataList.Count);
        Assert.AreEqual(0, (await service.List(User("other"), null, 20, null)).DataList.Count);
        Assert.IsNull(await service.Get(User("other"), id));
        Assert.IsNull(await service.Save(User("other"), id, Data("Stolen", 1)));
        Assert.IsFalse(await service.Delete(User("other"), id, 1));
        await Assert.ThrowsExceptionAsync<PersonalNoteConflictException>(() => service.Save(User("other"), id, Data("Collision")));
        Assert.AreEqual("Ghi chú của tôi", (await service.Get(User(), id))!.Title);
    }

    [TestMethod]
    public async Task RetryingCreate_IsIdempotentAndDoesNotOverwriteADifferentDocument()
    {
        string id = Guid.NewGuid().ToString();
        var first = await service.Save(User(), id, Data());
        var retry = await service.Save(User(), id, Data());
        Assert.AreEqual(first!.NoteId, retry!.NoteId); Assert.AreEqual(1, await db.PersonalNote.CountAsync());
        await Assert.ThrowsExceptionAsync<PersonalNoteConflictException>(() => service.Save(User(), id, Data("Different")));
        Assert.AreEqual("My note", (await service.Get(User(), id))!.Title);
    }

    [TestMethod]
    public async Task Versions_ProtectAgainstOverwritingOrDeletingNewerChangesFromAnotherTab()
    {
        string id = Guid.NewGuid().ToString(); await service.Save(User(), id, Data());
        var updated = await service.Save(User(), id, Data("New title", 1));
        Assert.AreEqual(2, updated!.Version);
        await Assert.ThrowsExceptionAsync<PersonalNoteConflictException>(() => service.Save(User(), id, Data("Stale", 1)));
        await Assert.ThrowsExceptionAsync<PersonalNoteConflictException>(() => service.Delete(User(), id, 1));
        Assert.AreEqual("New title", (await service.Get(User(), id))!.Title);
        Assert.IsTrue(await service.Delete(User(), id, 2));
        Assert.IsNull(await service.Get(User(), id));
    }

    [TestMethod]
    public async Task DocumentValidation_RejectsHtmlExecutableLinksInvalidStructuresAndOversizedContent()
    {
        string[] invalid =
        {
            "<p>HTML</p>", "{}", """{"type":"doc","content":[{"type":"image","attrs":{"src":"https://example.com/a.png"}}]}""",
            """{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Click","marks":[{"type":"link","attrs":{"href":"javascript:alert(1)"}}]}]}]}""",
            """{"type":"doc","content":[{"type":"heading","attrs":{"level":"wrong"}}]}""",
            """{"type":"doc","content":[{"type":"taskList","content":[{"type":"taskItem","content":[{}]}]}]}""",
            new string('x', 500_001),
        };
        foreach (string json in invalid)
            await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.Save(User(), Guid.NewGuid().ToString(), Data(json: json)));
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.Save(User(), Guid.NewGuid().ToString(), Data(" ")));
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.Save(User(), "invalid-id", Data()));
        Assert.AreEqual(0, await db.PersonalNote.CountAsync());
    }

    [TestMethod]
    public async Task RichNotes_KeepFormattingChecklistCodeAndSafeLinksAndSearchPlainText()
    {
        const string rich = """{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Ideas","marks":[{"type":"bold"}]}]},{"type":"taskList","content":[{"type":"taskItem","attrs":{"checked":true},"content":[{"type":"paragraph","content":[{"type":"text","text":"Private plan","marks":[{"type":"link","attrs":{"href":"https://example.com","target":"_blank","rel":"noopener noreferrer nofollow","class":null}}]}]}]}]},{"type":"codeBlock","attrs":{"language":null},"content":[{"type":"text","text":"<script>plain text</script>"}]}]}""";
        string id = Guid.NewGuid().ToString();
        await service.Save(User(), id, Data("Rich note", json: rich));
        Assert.AreEqual(rich, (await service.Get(User(), id))!.ContentJson);
        var found = await service.List(User(), "PRIVATE PLAN", 20, null);
        Assert.AreEqual(id, found.DataList.Single().NoteId);
        Assert.IsTrue(found.DataList[0].Preview.Contains("<script>plain text</script>"));
        Assert.AreEqual(0, (await service.List(User("other"), "Private plan", 20, null)).DataList.Count);
    }

    private static string ImageDocument(string source) => JsonSerializer.Serialize(new {
        type = "doc", content = new[] { new { type = "image", attrs = new { src = source, alt = (string?)null,
            title = (string?)null, width = (int?)null, height = (int?)null } } }
    });

    [TestMethod]
    public async Task PastedImages_PersistAsBase64WithoutLeakingImageBytesIntoListPreviews()
    {
        const string png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1sAAAAASUVORK5CYII=";
        string id = Guid.NewGuid().ToString(), json = ImageDocument(png);
        await service.Save(User(), id, Data("Screenshot", json: json));
        Assert.AreEqual(json, (await service.Get(User(), id))!.ContentJson);
        var summary = JsonSerializer.Serialize(await service.List(User(), null, 20, null));
        Assert.IsFalse(summary.Contains("base64"));
        Assert.IsNull(await service.Get(User("other"), id));
        await service.Save(User(), id, Data("Updated screenshot", 1, json));
        Assert.AreEqual(json, (await service.Get(User(), id))!.ContentJson);
    }

    [TestMethod]
    public async Task ImageValidation_RejectsSvgInvalidBytesOversizedImagesAndOversizedDocuments()
    {
        foreach (var source in new[] {
            "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=", "https://example.com/image.png",
            "javascript:alert(1)", "data:image/png;base64,bm90IGFuIGltYWdl", "data:image/png;base64,broken!",
            "data:image/png;base64," + Convert.ToBase64String(new byte[2 * 1024 * 1024 + 1])
        })
            await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.Save(User(), Guid.NewGuid().ToString(), Data(json: ImageDocument(source))));
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.Save(User(), Guid.NewGuid().ToString(),
            Data(json: Document.Replace("Ý tưởng riêng tư", new string('x', 500_001)))));
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.Save(User(), Guid.NewGuid().ToString(),
            Data(json: new string('x', PersonalNoteSaveDto.MaxContentLength + 1))));
        Assert.AreEqual(0, await db.PersonalNote.CountAsync());
    }

    [TestMethod]
    public async Task Cursor_IsStableForTiedDatesAndBoundToOwnerAndSearch()
    {
        foreach (var title in new[] { "Note a", "Note b", "Note c" }) await service.Save(User(), Guid.NewGuid().ToString(), Data(title));
        var tie = new DateTime(2026, 10, 19, 0, 0, 0, DateTimeKind.Utc);
        await db.PersonalNote.ExecuteUpdateAsync(s => s.SetProperty(n => n.UpdatedAt, tie));
        var first = await service.List(User(), "Note", 1, null);
        var second = await service.List(User(), "Note", 1, first.NextCursor);
        var third = await service.List(User(), "Note", 1, second.NextCursor);
        Assert.AreEqual(3, new[] { first, second, third }.SelectMany(p => p.DataList).Select(n => n.NoteId).Distinct().Count());
        Assert.IsFalse(third.HasMore);
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.List(User("other"), "Note", 1, first.NextCursor));
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.List(User(), "different", 1, first.NextCursor));
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.List(User(), "", 1, "invalid"));
    }

    [TestMethod]
    public async Task AllOperations_RequireAnAuthenticatedIdentity()
    {
        var guest = new ClaimsPrincipal(); string id = Guid.NewGuid().ToString();
        await Assert.ThrowsExceptionAsync<UnauthorizedAccessException>(() => service.List(guest, "", 20, null));
        await Assert.ThrowsExceptionAsync<UnauthorizedAccessException>(() => service.Get(guest, id));
        await Assert.ThrowsExceptionAsync<UnauthorizedAccessException>(() => service.Save(guest, id, Data()));
        await Assert.ThrowsExceptionAsync<UnauthorizedAccessException>(() => service.Delete(guest, id, 1));
        await Assert.ThrowsExceptionAsync<UnauthorizedAccessException>(() => service.Publish(guest, id, Data()));
        await Assert.ThrowsExceptionAsync<UnauthorizedAccessException>(() => service.Unpublish(guest, id, 1));
    }

    [TestMethod]
    public async Task Publications_ExposeOnlySnapshots_RespectOwnershipAndVersions_AndRotateRevokedLinks()
    {
        string id = Guid.NewGuid().ToString();
        await service.Save(User(), id, Data("Draft"));
        Assert.IsNull(await service.Public(id));
        var published = (await service.Publish(User(), id, Data("Published", 1)))!;
        string token = published.PublicToken!;
        Assert.AreEqual(64, token.Length);
        Assert.AreEqual("Published", (await service.Public(token))!.Title);
        var draft = (await service.Save(User(), id, Data("Private changes", published.Version)))!;
        Assert.AreEqual("Published", (await service.Public(token))!.Title);
        Assert.IsNull(await service.Publish(User("other"), id, Data("Stolen", draft.Version)));
        Assert.IsNull(await service.Unpublish(User("other"), id, draft.Version));
        await Assert.ThrowsExceptionAsync<PersonalNoteConflictException>(() => service.Publish(User(), id, Data("Stale", published.Version)));
        Assert.AreEqual("Private changes", (await service.Get(User(), id))!.Title);
        var updated = (await service.Publish(User(), id, Data("Updated publication", draft.Version)))!;
        Assert.AreEqual(token, updated.PublicToken);
        Assert.AreEqual("Updated publication", (await service.Public(token))!.Title);
        await Assert.ThrowsExceptionAsync<PersonalNoteConflictException>(() => service.Unpublish(User(), id, draft.Version));
        var revoked = (await service.Unpublish(User(), id, updated.Version))!;
        Assert.IsNull(revoked.PublicToken);
        Assert.IsNull(await service.Public(token));
        var republished = (await service.Publish(User(), id, Data("Republished", revoked.Version)))!;
        Assert.AreNotEqual(token, republished.PublicToken);
        Assert.IsNull(await service.Public(token));
        Assert.AreEqual("Republished", (await service.Public(republished.PublicToken!))!.Title);
        await service.Delete(User(), id, republished.Version);
        Assert.IsNull(await service.Public(republished.PublicToken!));
    }

    [TestMethod]
    public async Task PublishingANewNote_IsAtomicAndCreateRetriesAreIdempotent()
    {
        string id = Guid.NewGuid().ToString();
        var first = (await service.Publish(User(), id, Data()))!;
        var retry = (await service.Publish(User(), id, Data()))!;
        Assert.AreEqual(first.PublicToken, retry.PublicToken);
        Assert.AreEqual(first.Version, retry.Version);
        Assert.AreEqual(1, await db.PersonalNote.CountAsync());
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.Publish(User(), id, Data("Invalid", first.Version, "<script>bad</script>")));
        Assert.AreEqual(Document, (await service.Public(first.PublicToken!))!.ContentJson);
        Assert.AreEqual("My note", (await service.Get(User(), id))!.Title);
    }

    [TestMethod]
    public async Task Migration_CreatesThePrivateNoteStoreAndSupportsCreateUpdateDelete()
    {
        await db.Database.ExecuteSqlRawAsync("DROP TABLE \"PersonalNote\";");
        var assembly = typeof(AppDbContext).Assembly;
        var resource = assembly.GetManifestResourceNames().Single(n => n.EndsWith("0054_GhiChuCaNhan.sql"));
        using var reader = new StreamReader(assembly.GetManifestResourceStream(resource)!);
        await db.Database.ExecuteSqlRawAsync(await reader.ReadToEndAsync());
        var publicationResource = assembly.GetManifestResourceNames().Single(n => n.EndsWith("0056_XuatBanGhiChuCaNhan.sql"));
        using var publicationReader = new StreamReader(assembly.GetManifestResourceStream(publicationResource)!);
        await db.Database.ExecuteSqlRawAsync(await publicationReader.ReadToEndAsync());
        string id = Guid.NewGuid().ToString();
        await service.Save(User(), id, Data());
        await service.Save(User(), id, Data("Updated", 1));
        Assert.IsTrue(await service.Delete(User(), id, 2));
    }
}
