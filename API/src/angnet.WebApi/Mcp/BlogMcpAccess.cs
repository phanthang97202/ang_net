using System.Security.Claims;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;

namespace angnet.WebApi.Mcp;

// Check current database permissions, not stale permissions copied into a long-lived grant.
public sealed class BlogMcpAccess(AppDbContext db, UserManager<AppUser> users)
{
    public async Task<bool> HasPermission(AppUser user, string permission)
    {
        var roleIds = db.UserRoles.Where(x => x.UserId == user.Id).Select(x => x.RoleId);
        if (await db.Roles.AnyAsync(x => roleIds.Contains(x.Id) && x.Name == "Admin")) return true;
        return await db.RoleClaims.AnyAsync(x => roleIds.Contains(x.RoleId)
            && x.ClaimType == "permission" && x.ClaimValue == permission);
    }

    public async Task<AppUser?> CurrentUser(ClaimsPrincipal principal)
    {
        if (principal.Identity?.IsAuthenticated != true) return null;
        var id = principal.GetClaim(OpenIddictConstants.Claims.Subject);
        if (id is null) return null;
        var user = await users.FindByIdAsync(id);
        if (user is null || !user.FlagActive || await users.IsLockedOutAsync(user)
            || principal.GetClaim(BlogMcpOptions.StampClaim) != user.SecurityStamp
            || principal.GetClaim(AccountSessionService.VersionClaim) != user.SessionVersion.ToString(
                System.Globalization.CultureInfo.InvariantCulture)
            || !await HasPermission(user, "mcp.connect")) return null;
        return user;
    }

    public async Task<AppUser> Require(ClaimsPrincipal principal, string scope, params string[] permissions)
    {
        var user = await CurrentUser(principal);
        if (user is null || !principal.HasScope(scope))
            throw new ModelContextProtocol.McpException("Access denied. Reconnect the blog plugin or request the required scope.");
        foreach (var permission in permissions)
            if (!await HasPermission(user, permission))
                throw new ModelContextProtocol.McpException("Your account does not have permission for this operation.");
        return user;
    }
}

public sealed class BlogMcpRequirement : IAuthorizationRequirement;

public sealed class BlogMcpAuthorizationHandler(BlogMcpAccess access)
    : AuthorizationHandler<BlogMcpRequirement>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, BlogMcpRequirement requirement)
    {
        if (await access.CurrentUser(context.User) is not null) context.Succeed(requirement);
    }
}
