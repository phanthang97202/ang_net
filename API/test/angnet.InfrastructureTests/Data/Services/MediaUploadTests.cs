using System.Security.Claims;
using angnet.Domain.Dtos;
using angnet.Domain.Enums;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Services;
using angnet.WebApi.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace angnet.InfrastructureTests.Data.Services;

[TestClass]
public class MediaUploadTests
{
    [TestMethod]
    public void SignatureEndpoints_HaveSeparateDeviceUploadPermissions()
    {
        static string[] Policies(Type controller, string method) => controller.GetMethod(method)!
            .GetCustomAttributes(typeof(AuthorizeAttribute), true).Cast<AuthorizeAttribute>()
            .Select(x => x.Policy!).ToArray();
        CollectionAssert.AreEqual(new[] { "reel.upload_image" }, Policies(typeof(ReelUploadsController), "Image"));
        CollectionAssert.AreEqual(new[] { "reel.upload_video" }, Policies(typeof(ReelUploadsController), "Video"));
        CollectionAssert.AreEquivalent(new[] { "archive.use", "archive.upload" }, Policies(typeof(ArchiveController), "UploadSignature"));
    }

    [TestMethod]
    public async Task StoredArchiveCreation_RejectsMissingUploadPermissionBeforeSaving()
    {
        var archive = new Mock<IArchiveService>(MockBehavior.Strict);
        var authorization = new Mock<IAuthorizationService>();
        authorization.Setup(x => x.AuthorizeAsync(It.IsAny<ClaimsPrincipal>(), It.IsAny<object?>(), "archive.upload"))
            .ReturnsAsync(AuthorizationResult.Failed());
        var controller = new ArchiveController(archive.Object, null!, new ConfigurationBuilder().Build(), Mock.Of<ILogger<ArchiveController>>());
        Assert.IsInstanceOfType(await controller.CreateItem(new() { StoragePublicId = "archive/me/test" }, authorization.Object), typeof(ForbidResult));
        archive.VerifyNoOtherCalls();
    }

    [TestMethod]
    public async Task PastedArchiveImage_RequiresDeviceUploadPermissionBeforeSaving()
    {
        var archive = new Mock<IArchiveService>(MockBehavior.Strict);
        var authorization = new Mock<IAuthorizationService>();
        authorization.Setup(x => x.AuthorizeAsync(It.IsAny<ClaimsPrincipal>(), It.IsAny<object?>(), "archive.upload"))
            .ReturnsAsync(AuthorizationResult.Failed());
        var controller = new ArchiveController(archive.Object, null!, new ConfigurationBuilder().Build(), Mock.Of<ILogger<ArchiveController>>());
        Assert.IsInstanceOfType(await controller.CreateItem(new()
        {
            Kind = EArchiveItemKind.Image,
            SourceUrl = " data:image/png;base64,iVBORw0KGgo=",
        }, authorization.Object), typeof(ForbidResult));
        archive.VerifyNoOtherCalls();
    }

    private static async Task<AppDbContext> CreateArchiveDatabase()
    {
        var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite("Data Source=:memory:").Options);
        await db.Database.OpenConnectionAsync();
        await db.Database.EnsureCreatedAsync();
        db.Users.Add(new AppUser { Id = "me" });
        db.ArchiveCollection.Add(new ArchiveCollectionModel { CollectionId = "collection", OwnerId = "me", Name = "Screenshots" });
        await db.SaveChangesAsync();
        return db;
    }

    [TestMethod]
    public async Task PastedArchiveImage_RoundTripsAsBase64WithPrivateAccessAndNoCloudinaryAsset()
    {
        await using var db = await CreateArchiveDatabase();
        var service = new ArchiveService(db);
        const string image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
        var result = await service.CreateItemAsync("me", new()
        {
            CollectionId = "collection", Kind = EArchiveItemKind.Image,
            SourceUrl = image, Title = "Ảnh chụp màn hình", Bytes = 999,
        }, "");
        Assert.IsTrue(result.Success, result.ErrorMessage);
        Assert.AreEqual(image, result.Data.SourceUrl);
        Assert.AreEqual(image, result.Data.ThumbnailUrl);
        Assert.AreEqual(Convert.FromBase64String(image.Split(',')[1]).LongLength, result.Data.Bytes);
        Assert.AreEqual("", (await db.ArchiveItem.SingleAsync()).StoragePublicId);
        Assert.IsFalse((await service.GetItemsAsync("other", "collection", 0, 24)).Success);
        var feed = await service.GetItemsAsync("me", "collection", 0, 24);
        Assert.AreEqual(image, ((PageInfo<ArchiveItemDto>)feed.objResult).DataList.Single().SourceUrl);

        var edited = await service.UpdateItemAsync("me", new() { ItemId = result.Data.ItemId, Title = "Updated" });
        Assert.IsTrue(edited.Success);
        Assert.AreEqual(image, edited.Data.SourceUrl);
        Assert.IsTrue((await service.UpdateCollectionAsync("me", new()
        {
            CollectionId = "collection", Name = "Screenshots", CoverUrl = image,
        })).Success);
        Assert.AreEqual(image, (await service.GetCollectionAsync("me", "collection")).Data.CoverUrl);

        var deleted = await service.DeleteItemAsync("me", result.Data.ItemId);
        Assert.IsTrue(deleted.Response.Success);
        Assert.AreEqual(0, deleted.Files.Count);
    }

    [DataTestMethod]
    [DataRow("data:image/png;base64,not-base64")]
    [DataRow("data:image/png;base64,")]
    [DataRow("data:image/png;base64,SGVsbG8=")]
    [DataRow("data:image/jpeg;base64,iVBORw0KGgo=")]
    [DataRow("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")]
    [DataRow("data:text/html;base64,PHNjcmlwdD4=")]
    [DataRow("data:image/png,iVBORw0KGgo=")]
    public async Task PastedArchiveImage_RejectsInvalidPayloads(string source)
    {
        await using var db = await CreateArchiveDatabase();
        var result = await new ArchiveService(db).CreateItemAsync("me", new()
        {
            CollectionId = "collection", Kind = EArchiveItemKind.Image, SourceUrl = source,
        }, "");
        Assert.IsFalse(result.Success);
        Assert.AreEqual(0, await db.ArchiveItem.CountAsync());
    }

    [TestMethod]
    public async Task PastedArchiveImage_EnforcesDecodedSizeKindAndOwnership()
    {
        await using var db = await CreateArchiveDatabase();
        var service = new ArchiveService(db);
        byte[] bytes = new byte[2 * 1024 * 1024];
        Convert.FromHexString("89504E470D0A1A0A").CopyTo(bytes, 0);
        var request = new ArchiveItemCreateDto
        {
            CollectionId = "collection", Kind = EArchiveItemKind.Image,
            SourceUrl = "data:image/png;base64," + Convert.ToBase64String(bytes),
        };
        Assert.IsFalse((await service.CreateItemAsync("me", request, "")).Success);
        request.SourceUrl = "data:image/png;base64," + Convert.ToBase64String(bytes.AsSpan(0, bytes.Length - 1));
        Assert.IsFalse((await service.CreateItemAsync("other", request, "")).Success);
        request.Kind = EArchiveItemKind.Video;
        Assert.IsFalse((await service.CreateItemAsync("me", request, "")).Success);
        request.Kind = EArchiveItemKind.Link;
        Assert.IsFalse((await service.CreateItemAsync("me", request, "")).Success);
        request.Kind = EArchiveItemKind.Image;
        var accepted = await service.CreateItemAsync("me", request, "");
        Assert.IsTrue(accepted.Success, accepted.ErrorMessage);
        Assert.AreEqual((long)bytes.Length - 1, accepted.Data.Bytes);
    }

    [DataTestMethod]
    [DataRow(EArchiveItemKind.Image)]
    [DataRow(EArchiveItemKind.Video)]
    public async Task ExternalArchiveMedia_RequiresNoCloudinaryConfigurationAndDoesNotDeleteAssets(EArchiveItemKind kind)
    {
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite("Data Source=:memory:").Options);
        await db.Database.OpenConnectionAsync();
        await db.Database.EnsureCreatedAsync();
        db.Users.Add(new AppUser { Id = "me" });
        db.ArchiveCollection.Add(new ArchiveCollectionModel { CollectionId = "collection", OwnerId = "me" });
        await db.SaveChangesAsync();
        var service = new ArchiveService(db);
        var request = new ArchiveItemCreateDto { CollectionId = "collection", Kind = kind, SourceUrl = "https://example.com/media" };
        var result = await service.CreateItemAsync("me", request, "");
        Assert.IsTrue(result.Success, result.ErrorMessage);
        Assert.AreEqual(kind, result.Data.Kind);
        Assert.AreEqual(EArchiveProvider.Web, result.Data.Provider);
        Assert.AreEqual("", (await db.ArchiveItem.SingleAsync()).StoragePublicId);
        var deleted = await service.DeleteItemAsync("me", result.Data.ItemId);
        Assert.IsTrue(deleted.Response.Success);
        Assert.AreEqual(0, deleted.Files.Count);
        request.SourceUrl = "javascript:alert(1)";
        Assert.IsFalse((await service.CreateItemAsync("me", request, "")).Success);
        request.SourceUrl = "https://example.com/media";
        Assert.IsFalse((await service.CreateItemAsync("other", request, "")).Success);
    }
}
