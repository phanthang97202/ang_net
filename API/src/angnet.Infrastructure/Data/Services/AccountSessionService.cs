using System.Globalization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace angnet.Infrastructure.Data.Services;

public class AccountSessionService(AppDbContext db)
{
    public const string VersionClaim = "session_version";

    public async Task<bool> IsCurrent(ClaimsPrincipal principal)
    {
        if (principal.Identity?.IsAuthenticated != true) return false;
        var id = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(id)) return false;
        var claim = principal.FindFirst(VersionClaim)?.Value;
        var version = 0;
        if (claim is not null && (!int.TryParse(claim, NumberStyles.None,
            CultureInfo.InvariantCulture, out version) || version < 0)) return false;
        return await db.Users.AsNoTracking().AnyAsync(u =>
            u.Id == id && u.FlagActive && u.SessionVersion == version);
    }

    // Caller owns the transaction, keeping the version and token revocation atomic.
    public static async Task RevokeAll(AppDbContext db, string userId, bool? active = null)
    {
        var now = DateTime.UtcNow;
        var stamp = Guid.NewGuid().ToString();
        var account = db.Users.Where(u => u.Id == userId);
        var changed = active.HasValue
            ? await account.ExecuteUpdateAsync(s => s
                .SetProperty(u => u.SessionVersion, u => u.SessionVersion + 1)
                .SetProperty(u => u.FlagActive, active.Value)
                .SetProperty(u => u.LockoutEnd, u => active.Value ? null : u.LockoutEnd)
                .SetProperty(u => u.AccessFailedCount, u => active.Value ? 0 : u.AccessFailedCount)
                .SetProperty(u => u.ConcurrencyStamp, stamp)
                .SetProperty(u => u.UpdatedDTime, now))
            : await account.ExecuteUpdateAsync(s => s
                .SetProperty(u => u.SessionVersion, u => u.SessionVersion + 1)
                .SetProperty(u => u.ConcurrencyStamp, stamp)
                .SetProperty(u => u.UpdatedDTime, now));
        if (changed != 1) throw new InvalidOperationException("Account no longer exists.");
        await db.RefreshToken.Where(t => t.UserId == userId && !t.IsRevoked)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.IsRevoked, true));
    }
}
