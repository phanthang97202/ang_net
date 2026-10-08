using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Text.RegularExpressions;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace angnet.Infrastructure.Data.Services;

public class AdminAccountService(AppDbContext db, UserManager<AppUser> users,
    RoleManager<IdentityRole> roles, IAuditTrailService audit) : IAdminAccountService
{
    public async Task<ApiResponse<UserDetailDto>> FindByEmail(ClaimsPrincipal actor, string email)
    {
        EnsureAdmin(actor);
        if (!ValidEmail(email)) return new("Email không hợp lệ.");
        var user = await users.FindByEmailAsync(email.Trim());
        return user == null ? new ApiResponse<UserDetailDto>() : new(await ToDto(user));
    }

    public async Task<ApiResponse<UserDetailDto>> Create(ClaimsPrincipal actor, AdminAccountCreateDto request)
    {
        var actorId = EnsureAdmin(actor);
        if ((request.Email != null && !ValidEmail(request.Email)) || string.IsNullOrWhiteSpace(request.FullName) || request.FullName.Length > 100)
            return new("Vui lòng nhập email và họ tên hợp lệ.");
        if (!ValidCredentials(request)) return new("Tên tài khoản hoặc mật khẩu không hợp lệ.");
        var email = request.Email;
        var username = request.UserName.Trim();
        if (email != null && await users.FindByEmailAsync(email) != null)
            return new("Email đã có tài khoản. Hãy chọn Thêm đăng nhập trên tài khoản hiện có; không tạo tài khoản thứ hai.");
        if (await users.FindByNameAsync(username) != null) return new("Tên tài khoản đã được sử dụng.");
        if (!await roles.RoleExistsAsync("User")) return new("Chưa cấu hình vai trò User trong hệ thống.");

        return await Transaction(async () =>
        {
            var now = DateTime.UtcNow;
            var user = new AppUser
            {
                UserName = username, Email = email, FullName = request.FullName.Trim(),
                FlagActive = true, LockoutEnabled = true, CreatedDTime = now, UpdatedDTime = now
            };
            var created = await users.CreateAsync(user, request.Password);
            if (!created.Succeeded) return Failure(created);
            var assigned = await users.AddToRoleAsync(user, "User");
            if (!assigned.Succeeded) return Failure(assigned);
            await Record(actorId, user.Id, "Tạo tài khoản bằng tên đăng nhập");
            return new ApiResponse<UserDetailDto>(await ToDto(user));
        });
    }

    public async Task<ApiResponse<UserDetailDto>> AddCredentials(ClaimsPrincipal actor, string userId, AccountCredentialsDto request)
    {
        var actorId = EnsureAdmin(actor);
        if (!ValidCredentials(request)) return new("Tên tài khoản hoặc mật khẩu không hợp lệ.");
        var user = await users.FindByIdAsync(userId);
        if (user == null) return new("Tài khoản không tồn tại.");
        if (await users.HasPasswordAsync(user)) return new("Tài khoản đã có mật khẩu. Hãy dùng thao tác Đặt lại mật khẩu.");
        var username = request.UserName.Trim();
        var duplicate = await users.FindByNameAsync(username);
        if (duplicate != null && duplicate.Id != user.Id) return new("Tên tài khoản đã được sử dụng.");

        return await Transaction(async () =>
        {
            // Username and password commit together; never leave a partial update.
            var renamed = await users.SetUserNameAsync(user, username);
            if (!renamed.Succeeded) return Failure(renamed);
            user.UpdatedDTime = DateTime.UtcNow;
            user.LockoutEnabled = true;
            var added = await users.AddPasswordAsync(user, request.Password);
            if (!added.Succeeded) return Failure(added);
            await Record(actorId, user.Id, "Bổ sung đăng nhập bằng tên tài khoản và mật khẩu");
            return new ApiResponse<UserDetailDto>(await ToDto(user));
        });
    }

    public async Task<ApiResponse<UserDetailDto>> ResetPassword(ClaimsPrincipal actor, string userId, AdminPasswordResetDto request)
    {
        var actorId = EnsureAdmin(actor);
        if (request.Password == null || request.Password.Length is < 8 or > 128)
            return new("Mật khẩu phải có từ 8 đến 128 ký tự.");
        var user = await users.FindByIdAsync(userId);
        if (user == null) return new("Tài khoản không tồn tại.");
        if (!await users.HasPasswordAsync(user)) return new("Tài khoản chưa có mật khẩu. Hãy dùng thao tác Thêm đăng nhập.");

        return await Transaction(async () =>
        {
            var token = await users.GeneratePasswordResetTokenAsync(user);
            user.UpdatedDTime = DateTime.UtcNow;
            var reset = await users.ResetPasswordAsync(user, token, request.Password);
            if (!reset.Succeeded) return Failure(reset);
            var unlocked = await users.SetLockoutEndDateAsync(user, null);
            if (!unlocked.Succeeded) return Failure(unlocked);
            var cleared = await users.ResetAccessFailedCountAsync(user);
            if (!cleared.Succeeded) return Failure(cleared);
            await db.RefreshToken.Where(x => x.UserId == user.Id && !x.IsRevoked)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsRevoked, true));
            // An older emailed reset code must not undo an admin password reset.
            if (!string.IsNullOrWhiteSpace(user.Email))
                await db.GenerationAuthCode.Where(x => x.UserId == user.Email && !x.IsUsed)
                    .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsUsed, true));
            await Record(actorId, user.Id, "Đặt lại mật khẩu và thu hồi refresh token");
            return new ApiResponse<UserDetailDto>(await ToDto(user));
        });
    }

    private async Task<ApiResponse<UserDetailDto>> Transaction(Func<Task<ApiResponse<UserDetailDto>>> action) =>
        await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync();
            var result = await action();
            if (result.Success) await transaction.CommitAsync();
            return result;
        });

    private async Task<UserDetailDto> ToDto(AppUser user) => new()
    {
        Id = user.Id, UserName = user.UserName ?? "", Email = user.Email, FullName = user.FullName,
        Avatar = user.Avatar, FlagActive = user.FlagActive, HasPassword = await users.HasPasswordAsync(user),
        Roles = (await users.GetRolesAsync(user)).ToArray()
    };

    private async Task Record(string actorId, string userId, string action)
    {
        var result = await audit.Create(new AuditTrailDto
        {
            RecordId = userId, Description = $"Admin {actorId}: {action}.", ChangedColumns = "AccountCredentials"
        });
        if (!result.Success) throw new InvalidOperationException("Không thể ghi nhật ký quản lý tài khoản.");
    }

    private static string EnsureAdmin(ClaimsPrincipal actor)
    {
        var id = actor.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (actor.Identity?.IsAuthenticated != true || !actor.IsInRole("Admin") || string.IsNullOrWhiteSpace(id))
            throw new UnauthorizedAccessException();
        return id;
    }
    private static bool ValidEmail(string email) => !string.IsNullOrWhiteSpace(email)
        && email.Trim().Length <= 256 && new EmailAddressAttribute().IsValid(email.Trim());
    private static bool ValidCredentials(AccountCredentialsDto request) => !string.IsNullOrWhiteSpace(request.UserName)
        && Regex.IsMatch(request.UserName.Trim(), "^[a-zA-Z0-9][a-zA-Z0-9._-]{2,31}$")
        && request.Password != null && request.Password.Length is >= 8 and <= 128;

    private static ApiResponse<UserDetailDto> Failure(IdentityResult result) => new(string.Join(" ", result.Errors.Select(e => e.Code switch
    {
        "DuplicateUserName" => "Tên tài khoản đã được sử dụng.",
        "DuplicateEmail" => "Email đã có tài khoản.",
        "PasswordTooShort" => "Mật khẩu quá ngắn.",
        "PasswordRequiresDigit" => "Mật khẩu cần có chữ số.",
        "PasswordRequiresLower" => "Mật khẩu cần có chữ thường.",
        "PasswordRequiresUpper" => "Mật khẩu cần có chữ hoa.",
        "PasswordRequiresNonAlphanumeric" => "Mật khẩu cần có ký tự đặc biệt.",
        "UserAlreadyHasPassword" => "Tài khoản đã có mật khẩu; không được ghi đè.",
        _ => "Không thể lưu thay đổi tài khoản. Hãy tải lại danh sách và thử lại."
    })));
}
