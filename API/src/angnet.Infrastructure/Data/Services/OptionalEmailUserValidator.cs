using System.ComponentModel.DataAnnotations;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Identity;

namespace angnet.Infrastructure.Data.Services;

// The standard username validator remains enabled. Emails are optional, but
// supplied emails must still be valid and unique (also enforced by EmailIndex).
public class OptionalEmailUserValidator : IUserValidator<AppUser>
{
    public async Task<IdentityResult> ValidateAsync(UserManager<AppUser> manager, AppUser user)
    {
        var email = await manager.GetEmailAsync(user);
        if (email == null) return IdentityResult.Success;
        if (string.IsNullOrWhiteSpace(email) || email.Length > 256 || !new EmailAddressAttribute().IsValid(email))
            return IdentityResult.Failed(manager.ErrorDescriber.InvalidEmail(email));
        var owner = await manager.FindByEmailAsync(email);
        return owner != null && await manager.GetUserIdAsync(owner) != await manager.GetUserIdAsync(user)
            ? IdentityResult.Failed(manager.ErrorDescriber.DuplicateEmail(email))
            : IdentityResult.Success;
    }
}
