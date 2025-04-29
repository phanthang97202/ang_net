using API.Data;
using SharedModels.Dtos;
using SharedModels.Models;
using API.IRespositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GuardAuth = API.Middlewares.CheckAuthorized;
using TCommonUtils = CommonUtils.CommonUtils.CommonUtils;
using Google.Apis.Auth;

namespace API.Respositories
{
    public class AccountRespository : IAccountRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;

        private readonly UserManager<API.Models.AppUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _configuration;

        public AccountRespository(UserManager<API.Models.AppUser> userManager
                                    , RoleManager<IdentityRole> roleManager
                                    , IHttpContextAccessor httpContextAccessor
                                    , IConfiguration configuration
                                    , AppDbContext dbContext
                                 )
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _httpContextAccessor = httpContextAccessor;
            _configuration = configuration;
            _dbContext = dbContext;
        }

        public string GenerateAccessToken(API.Models.AppUser user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration.GetSection("JWTSetting").GetSection("securityKey").Value!);
            var validAudience = _configuration.GetSection("JWTSetting").GetSection("validAudience").Value!;
            var validIssuer = _configuration.GetSection("JWTSetting").GetSection("validIssuer").Value!;
            var accessTokenExpired = Convert.ToDouble(_configuration.GetSection("JWTSetting").GetSection("accessTokenExpired").Value!);
            var roles = _userManager.GetRolesAsync(user).Result;

            List<Claim> claims = [
                new (JwtRegisteredClaimNames.Email, user.Email ?? "") ,
                new (JwtRegisteredClaimNames.Name, user.FullName ?? "") ,
                new (JwtRegisteredClaimNames.NameId, user.Id ?? "") ,
                //new (JwtRegisteredClaimNames., user.Avatar ?? "") ,
                new (
                    JwtRegisteredClaimNames.Aud,
                    validAudience
                ),
                new (
                    JwtRegisteredClaimNames.Iss,
                    validIssuer
                )
            ];

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = TCommonUtils.DTimeNow().AddHours(accessTokenExpired),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256
                )
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }

        public string GenerateRefreshToken()
        {
            string refreshToken = Guid.NewGuid().ToString();
            return refreshToken;
        }

        public async Task<bool> ValidateRefreshToken(string refreshToken, string userId)
        {
            if (TCommonUtils.IsNullOrEmpty(refreshToken) || TCommonUtils.IsNullOrEmpty(userId))
            {
                return false;
            }

            RefreshTokenModel dtRefreshToken = await _dbContext.RefreshTokens
                                                        .FirstOrDefaultAsync(rt =>
                                                            rt.RefreshToken == refreshToken
                                                            && rt.UserId == userId
                                                        );

            if (dtRefreshToken is null)
            {
                return false;
            }

            bool isRevoked = dtRefreshToken.IsRevoked;
            bool isExpired = dtRefreshToken.ExpiryDate < TCommonUtils.DTimeNow();

            if (isRevoked == true || isExpired == true)
            {
                return false;
            }

            return true;
        }

        public async Task<bool> RevokeRefreshToken(string refreshToken, string userId)
        {
            try
            {
                if (TCommonUtils.IsNullOrEmpty(refreshToken) || TCommonUtils.IsNullOrEmpty(userId))
                {
                    return false;
                }

                await _dbContext.RefreshTokens
                                    .Where(rt => rt.RefreshToken == refreshToken && rt.UserId == userId)
                                    .ExecuteUpdateAsync<RefreshTokenModel>(setter =>
                                                                            setter.SetProperty(r => r.IsRevoked, true)
                                                                          );
                await _dbContext.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<ApiResponse<UserDetailDto>> GetAllUser(ClaimsPrincipal User)
        {
            ApiResponse<UserDetailDto> apiResponse = new ApiResponse<UserDetailDto>();
            List<RequestClient> requestClient = new List<RequestClient>();

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            // có thể thay thế bằng [Authorize(Roles = "Admin")]
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(currentUserId!);
            var roles = await _userManager.GetRolesAsync(user!);
            bool isValid = roles.Contains("Admin");

            if (!isValid)
            {
                apiResponse.CatchException(false, "Account.NotPermission", requestClient);
                return apiResponse;
            }
            else
            {
                // Đây là "async-over-sync deadlock" – vì bạn đang chặn luồng hiện tại để đợi một tác
                // vụ async trong khi EF Core cũng đang sử dụng cùng một kết nối để load dữ liệu.
                // PostgreSQL (thông qua Npgsql) không hỗ trợ nhiều lệnh đồng thời trên cùng một connection.
                
                //var result = await _userManager.Users.Select(u => new UserDetailDto
                //{
                //    Id = u.Id,
                //    Email = u.Email,
                //    FullName = u.FullName,
                //    Avatar = u.Avatar,
                //    FlagActive = u.FlagActive,
                //    Roles = _userManager.GetRolesAsync(u).Result.ToArray()
                //}).ToListAsync();

                // Thay thế bằng: => 
                var users = await _userManager.Users.ToListAsync();

                var result = new List<UserDetailDto>();

                foreach (var u in users)
                {
                    var _roles = await _userManager.GetRolesAsync(u); // Chờ đúng cách
                    result.Add(new UserDetailDto
                    {
                        Id = u.Id,
                        Email = u.Email,
                        FullName = u.FullName,
                        Avatar = u.Avatar,
                        FlagActive = u.FlagActive,
                        Roles = _roles.ToArray()
                    });
                }

                if (result.Count == 0)
                {
                    apiResponse.CatchException(false, "Account.EmptyUserList", requestClient);
                    return apiResponse;
                }

                apiResponse.DataList = result;
                return apiResponse;
            }
        }

        public async Task<ApiResponse<UserDetailDto>> GetUserDetail(ClaimsPrincipal User)
        {

            ApiResponse<UserDetailDto> apiResponse = new ApiResponse<UserDetailDto>();
            List<RequestClient> requestClient = new List<RequestClient>();

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(currentUserId!);

            if (user == null)
            {
                apiResponse.CatchException(false, "Account.UserHasNotFound", requestClient);
                return apiResponse;
            }

            UserDetailDto data = new UserDetailDto()
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Avatar = user.Avatar,
                Address = user.Address,
                FlagActive = user.FlagActive,
                Roles = [.. await _userManager.GetRolesAsync(user)],
                PhoneNumber = user.PhoneNumber,
                PhoneNumberConfirmed = user.PhoneNumberConfirmed,
                AccessFailedCount = user.AccessFailedCount,
            };

            apiResponse.Data = data;

            return apiResponse;
        }

        public async Task<ApiResponse<AuthResponseDto>> Login(LoginDto loginDto)
        {
            ApiResponse<AuthResponseDto> apiResponse = new ApiResponse<AuthResponseDto>();
            List<RequestClient> requestClient = new List<RequestClient>();

            var user = await _userManager.FindByEmailAsync(loginDto.Email);

            if (user is null)
            {
                apiResponse.CatchException(false, "Account.EmailIsNotExist", requestClient);
                return apiResponse;
            }

            var result = await _userManager.CheckPasswordAsync(user, loginDto.Password);

            if (!result)
            {
                apiResponse.CatchException(false, "Account.PasswordIsNotValid", requestClient);
                return apiResponse;
            }

            var accessToken = GenerateAccessToken(user);
            var refreshToken = GenerateRefreshToken();
            var refreshTokenExpired = Convert.ToDouble(_configuration.GetSection("JWTSetting").GetSection("refreshTokenExpired").Value!);

            RefreshTokenModel dtRefreshToken = new RefreshTokenModel
            {
                RefreshToken = refreshToken,
                UserId = user.Id,
                ExpiryDate = TCommonUtils.DTimeAddDay(refreshTokenExpired),
                IsRevoked = false,
            };

            _dbContext.RefreshTokens.Add(dtRefreshToken);
            await _dbContext.SaveChangesAsync();

            AuthResponseDto data = new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
            };

            apiResponse.Data = data;

            return apiResponse;
        }

        public async Task<ApiResponse<AuthResponseDto>> RefreshToken(RefreshTokenDto refreshTokenDto)
        {
            ApiResponse<AuthResponseDto> apiResponse = new ApiResponse<AuthResponseDto>();
            List<RequestClient> requestClient = new List<RequestClient>();

            // 1. check xem refresh token hợp lệ không
            // 2. nếu hợp lệ thì tạo mới access token và refresh token
            // 3. lưu lại refresh token mới vào db
            // 4. revoke token cũ
            // 5. trả về access token và refresh token mới

            API.Models.AppUser user = await _userManager.FindByIdAsync(refreshTokenDto.UserId);

            if (user is null)
            {
                apiResponse.CatchException(false, "Account.UserNotFound", requestClient);
                return apiResponse;
            }

            bool isValidRefreshToken = await ValidateRefreshToken(refreshTokenDto.RefreshToken, refreshTokenDto.UserId);

            if (!isValidRefreshToken)
            {
                apiResponse.CatchException(false, "Account.RefreshTokenInvalid", requestClient);
                return apiResponse;
            }

            var accessToken = GenerateAccessToken(user);
            var refreshToken = GenerateRefreshToken();
            var refreshTokenExpired = Convert.ToDouble(_configuration.GetSection("JWTSetting").GetSection("refreshTokenExpired").Value!);

            RefreshTokenModel dtRefreshToken = new RefreshTokenModel
            {
                RefreshToken = refreshToken,
                UserId = user.Id,
                ExpiryDate = TCommonUtils.DTimeAddDay(refreshTokenExpired),
                IsRevoked = false,
            };

            _dbContext.RefreshTokens.Add(dtRefreshToken);
            await RevokeRefreshToken(refreshTokenDto.RefreshToken, refreshTokenDto.UserId);
            await _dbContext.SaveChangesAsync();

            AuthResponseDto data = new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
            };

            apiResponse.Data = data;

            return apiResponse;
        }

        public async Task<ApiResponse<AuthResponseDto>> LoginWithGoogle(GoogleLoginDto request) {
            ApiResponse<AuthResponseDto> apiResponse = new ApiResponse<AuthResponseDto>();
            List<RequestClient> requestClient = new List<RequestClient>();

            var payload = await VerifyGoogleToken(request.IdToken);


            // Kiểm tra email, tạo user nếu chưa có, v.v.
            //var user = await _userService.FindOrCreateUser(payload.Email, payload.Name);


            API.Models.AppUser user = new API.Models.AppUser
            {
                Email = payload.Email,
                FullName = payload.Name,
                UserName = payload.Email
            };

            API.Models.AppUser userExist = await _userManager.FindByEmailAsync(payload.Email);

            if (userExist is null)
            {
                 
                await _userManager.CreateAsync(user);
                IdentityResult result = await _userManager.AddToRoleAsync(user, "User");
                if (result.Succeeded)
                {
                    await _userManager.AddToRoleAsync(user, "User");
                }
            }
            else
            {
                user = userExist;
            }


            // Tạo JWT token
            var accessToken = GenerateAccessToken(user);
            var refreshToken = GenerateRefreshToken();
            var refreshTokenExpired = Convert.ToDouble(_configuration.GetSection("JWTSetting").GetSection("refreshTokenExpired").Value!);

            RefreshTokenModel dtRefreshToken = new RefreshTokenModel
            {
                RefreshToken = refreshToken,
                UserId = user.Id,
                ExpiryDate = TCommonUtils.DTimeAddDay(refreshTokenExpired),
                IsRevoked = false,
            };

            _dbContext.RefreshTokens.Add(dtRefreshToken);
            await _dbContext.SaveChangesAsync();

            AuthResponseDto data = new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
            };

            apiResponse.Data = data;

            return apiResponse;
        }

        private async Task<GoogleJsonWebSignature.Payload> VerifyGoogleToken(string idToken)
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings()
            {
                Audience = new List<string> { "202020211023-c70kb86dn19s9q0tvotv94f04no8r1ct.apps.googleusercontent.com" } // thay bằng của bạn
            };

            try
            {
                var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
                return payload;
            }
            catch
            {
                return null;
            }
        }

        public async Task<ApiResponse<RegisterDto>> Register(RegisterDto registerDto)
        {
            ApiResponse<RegisterDto> apiResponse = new ApiResponse<RegisterDto>();
            List<RequestClient> requestClient = new List<RequestClient>();

            var user = new API.Models.AppUser
            {
                Email = registerDto.Email,
                FullName = registerDto.FullName,
                UserName = registerDto.Email
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);

            if (!result.Succeeded)
            {
                apiResponse.CatchException(false, "Account.OccurErrorWhileCreateNewUser", requestClient);
                return apiResponse;
            }

            if (registerDto.Roles is null)
            {
                await _userManager.AddToRoleAsync(user, "User");
            }
            //Không có quyền admin thì không được thêm roles
            //else
            //{
            //    foreach (var role in registerDto.Roles)
            //    {
            //        await _userManager.AddToRoleAsync(user, role);
            //    }
            //}

            return apiResponse;
        }

        public async Task<ApiResponse<string>> LogoutAllDevice(string userId)
        {
            ApiResponse<string> apiResponse = new ApiResponse<string>();
            List<RequestClient> requestClient = new List<RequestClient>();

            var user = await _userManager.FindByIdAsync(userId);

            if (user is null)
            {
                apiResponse.CatchException(false, "Account.UserNotFound", requestClient);
                return apiResponse;
            }

            await _dbContext.RefreshTokens
                                .Where(rt => rt.UserId == userId)
                                .ExecuteUpdateAsync<RefreshTokenModel>(setter =>
                                                                        setter.SetProperty(r => r.IsRevoked, true)
                                                                      );
            await _dbContext.SaveChangesAsync();

            apiResponse.Data = "LogoutFromAllDeviceSuccessfully!";
            return apiResponse;
        }
    }
}
