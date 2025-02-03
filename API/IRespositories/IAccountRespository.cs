using API.Dtos;
using API.Models;
using System.Security.Claims;

namespace API.IRespositories
{
    public interface IAccountRespository
    {
        public Task<ApiResponse<RegisterDto>> Register(RegisterDto registerDto);
        public Task<ApiResponse<AuthResponseDto>> Login(LoginDto loginDto);
        public string GenerateAccessToken(AppUser user);
        public string GenerateRefreshToken();
        public Task<ApiResponse<UserDetailDto>> GetUserDetail(ClaimsPrincipal User);
        public Task<ApiResponse<UserDetailDto>> GetAllUser(ClaimsPrincipal User);
    }
}
