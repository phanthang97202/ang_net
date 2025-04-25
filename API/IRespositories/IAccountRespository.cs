using SharedModels.Models;
using SharedModels.Dtos;
using System.Security.Claims;

namespace API.IRespositories
{
    public interface IAccountRespository
    {
        public Task<ApiResponse<RegisterDto>> Register(RegisterDto registerDto);
        public Task<ApiResponse<AuthResponseDto>> Login(LoginDto loginDto);
        public Task<ApiResponse<AuthResponseDto>> RefreshToken(RefreshTokenDto refreshTokenDto);
        //public string GenerateAccessToken(AppUser user);
        //public string GenerateRefreshToken();
        public Task<ApiResponse<AuthResponseDto>> LoginWithGoogle(GoogleLoginDto request);
        public Task<ApiResponse<UserDetailDto>> GetUserDetail(ClaimsPrincipal User);
        public Task<ApiResponse<UserDetailDto>> GetAllUser(ClaimsPrincipal User);
        public Task<ApiResponse<string>> LogoutAllDevice(string userId);
    }
}
