using System.Security.Claims;
using angnet.Domain.Dtos;

namespace angnet.Application.Interfaces.Services;

public interface IAdminAccountService
{
    Task<ApiResponse<UserDetailDto>> FindByEmail(ClaimsPrincipal actor, string email);
    Task<ApiResponse<UserDetailDto>> Create(ClaimsPrincipal actor, AdminAccountCreateDto request);
    Task<ApiResponse<UserDetailDto>> AddCredentials(ClaimsPrincipal actor, string userId, AccountCredentialsDto request);
    Task<ApiResponse<UserDetailDto>> ResetPassword(ClaimsPrincipal actor, string userId, AdminPasswordResetDto request);
    Task<ApiResponse<UserDetailDto>> RevokeSessions(ClaimsPrincipal actor, string userId);
    Task<ApiResponse<UserDetailDto>> SetLocked(ClaimsPrincipal actor, string userId, bool locked);
}
