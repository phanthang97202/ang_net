using System.Security.Claims;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Services;
using angnet.WebApi.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace angnet.InfrastructureTests.Data.Services;

[TestClass]
public class MovieWishlistTests
{
    private static AppDbContext Context() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseNpgsql("Host=localhost;Database=unused;Username=unused;Password=unused").Options);

    private static MovieWishlistController Controller(IMovieWishlistService service, string? userId)
    {
        var claims = userId == null ? Array.Empty<Claim>() : [new Claim(ClaimTypes.NameIdentifier, userId)];
        return new MovieWishlistController(service, Mock.Of<ILogger<MovieWishlistController>>())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(claims, "test")) }
            }
        };
    }

    [TestMethod]
    public async Task Controller_UsesSessionOwnerForSaveRemoveAndBrowse()
    {
        var service = new Mock<IMovieWishlistService>();
        service.Setup(x => x.Save("owner", "test-film", default)).ReturnsAsync(true);
        service.Setup(x => x.Remove("owner", "test-film", default)).ReturnsAsync(false);
        service.Setup(x => x.Browse("owner", "test", 2, default))
            .ReturnsAsync(new angnet.Domain.Dtos.MovieLibraryCatalogDto());
        var controller = Controller(service.Object, "owner");
        Assert.IsInstanceOfType(await controller.Save("test-film", default), typeof(OkObjectResult));
        Assert.IsInstanceOfType(await controller.Remove("test-film", default), typeof(OkObjectResult));
        Assert.IsInstanceOfType(await controller.Browse("test", 2, default), typeof(OkObjectResult));
        service.VerifyAll();
        Assert.AreEqual("movie.view", typeof(MovieWishlistController)
            .GetCustomAttributes(typeof(AuthorizeAttribute), false).Cast<AuthorizeAttribute>().Single().Policy);
    }

    [TestMethod]
    public async Task Controller_RejectsMissingOwnerWithoutCallingService()
    {
        var service = new Mock<IMovieWishlistService>(MockBehavior.Strict);
        var controller = Controller(service.Object, null);
        Assert.IsInstanceOfType(await controller.Save("test-film", default), typeof(UnauthorizedResult));
        Assert.IsInstanceOfType(await controller.Remove("test-film", default), typeof(UnauthorizedResult));
        Assert.IsInstanceOfType(await controller.Browse(), typeof(UnauthorizedResult));
        service.VerifyNoOtherCalls();
    }

    [TestMethod]
    public async Task Service_RejectsInvalidSlugBeforeProviderOrDatabase()
    {
        using var db = Context();
        var library = new Mock<IMovieLibraryService>(MockBehavior.Strict);
        var service = new MovieWishlistService(db, library.Object);
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.Save("owner", "../test", default));
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.Remove("owner", "bad/slug", default));
        library.VerifyNoOtherCalls();
    }

    [TestMethod]
    public async Task Service_RejectsMissingOwnerAndInvalidPagination()
    {
        using var db = Context();
        var service = new MovieWishlistService(db, Mock.Of<IMovieLibraryService>());
        await Assert.ThrowsExceptionAsync<UnauthorizedAccessException>(() => service.Save("", "test-film", default));
        await Assert.ThrowsExceptionAsync<UnauthorizedAccessException>(() => service.Remove("", "test-film", default));
        await Assert.ThrowsExceptionAsync<UnauthorizedAccessException>(() => service.Browse("", "", 1, default));
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.Browse("owner", "", 0, default));
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.Browse("owner", new string('x', 101), 1, default));
    }

    [TestMethod]
    public void Model_HasUniqueOwnerProviderSlugAndOwnerForeignKey()
    {
        using var db = Context();
        var entity = db.Model.FindEntityType(typeof(MovieWishlistModel))!;
        Assert.AreEqual("MovieWishlist", entity.GetTableName());
        Assert.IsTrue(entity.GetIndexes().Any(index => index.IsUnique &&
            index.Properties.Select(x => x.Name).SequenceEqual(["UserId", "Provider", "MovieSlug"])));
        var owner = entity.GetForeignKeys().Single();
        Assert.AreEqual(typeof(AppUser), owner.PrincipalEntityType.ClrType);
        Assert.AreEqual(DeleteBehavior.Cascade, owner.DeleteBehavior);
        Assert.AreEqual(200, entity.FindProperty("MovieSlug")!.GetMaxLength());
        Assert.AreEqual(2048, entity.FindProperty("PosterUrl")!.GetMaxLength());
    }
}
