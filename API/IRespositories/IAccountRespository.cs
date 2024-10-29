using API.Dtos;
using API.Models;
using System.Security.Claims;

namespace API.IRespositories
{
    public interface IAccountRespository
    {
        public Task<ApiResponse<RegisterDto>> Register(RegisterDto registerDto);
        public Task<ApiResponse<AuthResponseDto>> Login(LoginDto loginDto);
        public string GenerateToken(AppUser user);
        public Task<ApiResponse<UserDetailDto>> GetUserDetail(ClaimsPrincipal User);
        public Task<ApiResponse<UserDetailDto>> GetAllUser(ClaimsPrincipal User);
    }
}
