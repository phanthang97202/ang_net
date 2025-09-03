using angnet.Domain.Models;
using angnet.Domain.Dtos;
using System.Security.Claims;

namespace angnet.Application.Interfaces.Repositories
{
    public interface IAccountRespository
    {
        public Task<ApiResponse<string>> GetRegisterCode(string userEmail);
        public Task<ApiResponse<RegisterDto>> Register(RegisterDto registerDto);
        public Task<ApiResponse<AuthResponseDto>> Login(LoginDto loginDto);
        public Task<ApiResponse<AuthResponseDto>> RefreshToken(RefreshTokenDto refreshTokenDto);
        //public string GenerateAccessToken(AppUser user);
        //public string GenerateRefreshToken();
        public Task<ApiResponse<AuthResponseDto>> LoginWithGoogle(GoogleLoginDto request);
        public Task<ApiResponse<UserDetailDto>> GetUserDetail(ClaimsPrincipal User);
        public Task<ApiResponse<UserDetailDto>> GetAllUser(ClaimsPrincipal User);
        public Task<ApiResponse<string>> LogoutAllDevice(string userId);
        public Task<ApiResponse<string>> ForgotPassword(string userEmail);
        // if not old password => using code forgot password
        public Task<ApiResponse<string>> ChangePassword(ChangePassDto changePass);
        public Task<ApiResponse<string>> DeleteUser(string id);
    }
}
