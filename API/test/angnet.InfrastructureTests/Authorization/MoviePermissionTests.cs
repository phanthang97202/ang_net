using System.Security.Claims;
using angnet.WebApi.Authorization_Policy;
using Microsoft.AspNetCore.Authorization;

namespace angnet.InfrastructureTests.Authorization;

[TestClass]
public class MoviePermissionTests
{
    [DataTestMethod]
    [DataRow("movie.view", true)]
    [DataRow("anime.view", true)]
    [DataRow("anime.manage", false)]
    [DataRow("blog.view", false)]
    [DataRow("", false)]
    public async Task MovieView_RequiresNewOrLegacyViewerPermission(string permission, bool allowed)
    {
        var requirement = new PermissionRequirement("movie.view");
        var user = new ClaimsPrincipal(new ClaimsIdentity([new Claim("permission", permission)], "test"));
        var context = new AuthorizationHandlerContext([requirement], user, null);
        await new PermissionHandler().HandleAsync(context);
        Assert.AreEqual(allowed, context.HasSucceeded);
    }

    [TestMethod]
    public async Task LegacyViewer_DoesNotGrantOtherPermissionsOrAnonymousAccess()
    {
        var legacyClaims = new[] { new Claim("permission", "anime.view") };
        var otherRequirement = new PermissionRequirement("blog.update");
        var other = new AuthorizationHandlerContext([otherRequirement], new ClaimsPrincipal(new ClaimsIdentity(legacyClaims, "test")), null);
        await new PermissionHandler().HandleAsync(other);
        Assert.IsFalse(other.HasSucceeded);
        var movieRequirement = new PermissionRequirement("movie.view");
        var anonymous = new AuthorizationHandlerContext([movieRequirement], new ClaimsPrincipal(new ClaimsIdentity(legacyClaims)), null);
        await new PermissionHandler().HandleAsync(anonymous);
        Assert.IsFalse(anonymous.HasSucceeded);
    }
}
