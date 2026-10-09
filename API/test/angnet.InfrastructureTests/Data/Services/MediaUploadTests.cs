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
