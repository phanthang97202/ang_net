using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace angnet.WebApi.Controllers;

[ApiController]
[Route("api/Account/admin/users")]
[Authorize(Roles = "Admin")]
[EnableRateLimiting("API")]
public class AdminAccountsController(IAdminAccountService accounts, ILogger<AdminAccountsController> logger) : ControllerBase
{
    [HttpGet("by-email")]
    public Task<IActionResult> FindByEmail(string email) => Respond(() => accounts.FindByEmail(User, email));
    [HttpPost]
    public Task<IActionResult> Create(AdminAccountCreateDto request) => Respond(() => accounts.Create(User, request));
    [HttpPut("{userId}/credentials")]
    public Task<IActionResult> AddCredentials(string userId, AccountCredentialsDto request) => Respond(() => accounts.AddCredentials(User, userId, request));
    [HttpPost("{userId}/reset-password")]
    public Task<IActionResult> ResetPassword(string userId, AdminPasswordResetDto request) => Respond(() => accounts.ResetPassword(User, userId, request));
    [HttpPost("{userId}/revoke-sessions")]
    public Task<IActionResult> RevokeSessions(string userId) => Respond(() => accounts.RevokeSessions(User, userId));
    [HttpPost("{userId}/lock")]
    public Task<IActionResult> Lock(string userId) => Respond(() => accounts.SetLocked(User, userId, true));
    [HttpPost("{userId}/unlock")]
    public Task<IActionResult> Unlock(string userId) => Respond(() => accounts.SetLocked(User, userId, false));

    private async Task<IActionResult> Respond(Func<Task<ApiResponse<UserDetailDto>>> action)
    {
        try { return Ok(await action()); }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            return Conflict(new ApiResponse<UserDetailDto>("Email hoặc tên tài khoản đã được sử dụng. Hãy tải lại danh sách."));
        }
        catch (InvalidOperationException)
        {
            // Never log request bodies, Identity errors containing input, or passwords.
            logger.LogWarning("Admin account operation could not be completed");
            return StatusCode(503, new ApiResponse<UserDetailDto>("Không thể cập nhật tài khoản lúc này. Vui lòng thử lại."));
        }
    }
}
