using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GuardAuth = angnet.Utility.CommonUtils.CheckAuthorized;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;
using Google.Apis.Auth;
using angnet.Application.Interfaces.Repositories;
using angnet.Utility.CommonUtils;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using angnet.Application.Interfaces.Services;
using angnet.Infrastructure.Mail.Service;
using angnet.Infrastructure.Mail.Producer; 
using System.Security.Cryptography;
using Irony.Parsing;
using DocumentFormat.OpenXml.Spreadsheet;
using DnsClient;
using System.Runtime.InteropServices;


namespace angnet.Infrastructure.Data.Repositories
{
    public class AccountRespository : IAccountRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;

        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly WriteLog _logger;
        private readonly IAuditTrailService _auditTrailService;
        private readonly RabbitMqEmailProducer _rbmqEmailProducer;

        public AccountRespository(UserManager<AppUser> userManager
                                    , RabbitMqEmailProducer rbmqEmailProducer
                                    , RoleManager<IdentityRole> roleManager
                                    , IHttpContextAccessor httpContextAccessor
                                    , IConfiguration configuration
                                    , AppDbContext dbContext
                                    , WriteLog logger
                                    , IAuditTrailService auditTrailService  
                                 )
        {
            _rbmqEmailProducer = rbmqEmailProducer;
            _userManager = userManager;
            _roleManager = roleManager;
            _httpContextAccessor = httpContextAccessor;
            _configuration = configuration;
            _dbContext = dbContext;
            _logger = logger;
            _auditTrailService = auditTrailService; 
        }

        public string GenerateAccessToken(AppUser user)
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
                                    .ExecuteUpdateAsync(setter =>
                                                                            setter.SetProperty(r => r.IsRevoked, true)
                                                                          );
                await _dbContext.SaveChangesAsync();

                return true;
            }
            catch (Exception)
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
            _logger.LogInformation("LOGIN LOG", loginDto.Email, null);
            ApiResponse<AuthResponseDto> apiResponse = new ApiResponse<AuthResponseDto>();
            List<RequestClient> requestClient = new List<RequestClient>();

            var MaxFailedAccessAttempts = Convert.ToInt32(_configuration.GetSection("AspIdentity").GetSection("MaxFailedAccessAttempts").Value!);

            var user = await _userManager.FindByEmailAsync(loginDto.Email);

            // Check user is existed and actived ?
            if (user is null)
            {
                apiResponse.CatchException(false, "Account.EmailIsNotExist", requestClient);
                var logMsg = $"========LOGIN FAILED: Account.EmailIsNotExist=======\n user: {user} | password: {loginDto.Password} at DTime: {TCommonUtils.DTimeNow()}";
                _logger.LogWarning(logMsg);
                await _auditTrailService.Create(new AuditTrailDto
                {
                    Level = Domain.Enums.EAuditTrailLevel.ERROR,
                    RecordId = "",
                    Description = logMsg,
                    ChangedColumns = "",
                    OldValues = ""
                });
                return apiResponse;
            }
            
            if (!user.FlagActive)
            {
                apiResponse.CatchException(false, "Account.UserIsNotActived", requestClient);
                return apiResponse;
            }

            // Check if user is lockout ư
            var isUserLockout = await _userManager.IsLockedOutAsync(user);
            var dtimeCanTryLogin = await _userManager.GetLockoutEndDateAsync(user);
            if (isUserLockout)
            {
                apiResponse.CatchException(false, $"Account.AccountWasLockedOut(YouCanLoginAt{dtimeCanTryLogin})", requestClient);
                var logMsg = $"========USER WAS LOCKED=======\n user: {user} at DTime: {TCommonUtils.DTimeNow()}";
                _logger.LogWarning(logMsg);

                await _auditTrailService.Create(new AuditTrailDto
                {
                    Level = Domain.Enums.EAuditTrailLevel.CRITICAL,
                    RecordId = "",
                    Description = logMsg,
                    ChangedColumns = "",
                    OldValues = ""
                });
                return apiResponse;
            }

            var result = await _userManager.CheckPasswordAsync(user, loginDto.Password);

            if (!result)
            {
                if(user.LockoutEnabled)
                {
                    // prevent brute force (max failed 5 times)
                    await _userManager.AccessFailedAsync(user);
                    var failedCount = (await _userManager.GetAccessFailedCountAsync(user));

                    if (failedCount == 0) {
                        apiResponse.CatchException(false, $"Account.ExceedLoginAttemps(AccountWasLockedOut)", requestClient);

                        var logMsgg = $"========USER WAS LOCKED=======\n user: {user} at DTime: {TCommonUtils.DTimeNow()}";
                        _logger.LogWarning(logMsgg);
                        await _auditTrailService.Create(new AuditTrailDto
                        {
                            Level = Domain.Enums.EAuditTrailLevel.CRITICAL,
                            RecordId = "",
                            Description = logMsgg,
                            ChangedColumns = "",
                            OldValues = ""
                        });
                        return apiResponse;
                    }

                    var remainTryLogin = MaxFailedAccessAttempts - failedCount;
                    apiResponse.CatchException(false, $"Account.PasswordIsNotValid(YouHave{remainTryLogin}TimesRemain)", requestClient);

                    var logMsgs = $"========LOGIN FAILED: Account.PasswordIsNotValid=======\n user: {user} | password: {loginDto.Password} at DTime: {TCommonUtils.DTimeNow()}";
                    _logger.LogWarning(logMsgs);

                    await _auditTrailService.Create(new AuditTrailDto
                    {
                        Level = Domain.Enums.EAuditTrailLevel.WARNING,
                        RecordId = "",
                        Description = logMsgs,
                        ChangedColumns = "",
                        OldValues = ""
                    });
                    return apiResponse;
                }

                apiResponse.CatchException(false, $"Account.PasswordIsNotValid", requestClient);

                var logMsg = $"========LOGIN FAILED: Account.PasswordIsNotValid=======\n user: {user} | password: {loginDto.Password} at DTime: {TCommonUtils.DTimeNow()}";
                _logger.LogWarning(logMsg);
                await _auditTrailService.Create(new AuditTrailDto
                {
                    Level = Domain.Enums.EAuditTrailLevel.WARNING,
                    RecordId = "",
                    Description = logMsg,
                    ChangedColumns = "",
                    OldValues = ""
                });
                return apiResponse;
            }

            // Dismiss failed count history
            await _userManager.ResetAccessFailedCountAsync(user);

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

            // xóa hết token nếu user tự nhiên nhớ ra mật khẩu trong khi đã gửi code reset password xong không dùng
            await DisableAllTokenNotUse(user.Email, ConstValue.TYPE_AUTH_CODE_FORGOT_PASSWORD);

            await _dbContext.SaveChangesAsync();

            AuthResponseDto data = new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
            };

            apiResponse.Data = data;

            await _auditTrailService.Create(new AuditTrailDto
            {
                RecordId = "",
                Description = $"{user.Email} has login successfully!",
                ChangedColumns = "",
                OldValues = ""
            });

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

            AppUser user = await _userManager.FindByIdAsync(refreshTokenDto.UserId);

            if (user is null)
            {
                apiResponse.CatchException(false, "Account.UserNotFound", requestClient);
                return apiResponse;
            }

            if (!user.FlagActive)
            {
                apiResponse.CatchException(false, "Account.UserIsNotActived", requestClient);
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

        public async Task<ApiResponse<AuthResponseDto>> LoginWithGoogle(GoogleLoginDto request)
        {
            ApiResponse<AuthResponseDto> apiResponse = new ApiResponse<AuthResponseDto>();
            List<RequestClient> requestClient = new List<RequestClient>();

            var payload = await VerifyGoogleToken(request.IdToken);


            // Kiểm tra email, tạo user nếu chưa có, v.v.
            //var user = await _userService.FindOrCreateUser(payload.Email, payload.Name);


            AppUser user = new AppUser
            {
                Email = payload.Email,
                FullName = payload.Name,
                UserName = payload.Email,
                FlagActive = true,
                CreatedDTime = TCommonUtils.DTimeNow(),
                UpdatedDTime = TCommonUtils.DTimeNow()
            };

            AppUser userExist = await _userManager.FindByEmailAsync(payload.Email);

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
                if (!userExist.FlagActive)
                {
                    apiResponse.CatchException(false, "Account.UserIsNotActived", requestClient);
                    return apiResponse;
                }

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

            // xóa hết token nếu user tự nhiên nhớ ra mật khẩu trong khi đã gửi code reset password xong không dùng
            await DisableAllTokenNotUse(user.Email, ConstValue.TYPE_AUTH_CODE_FORGOT_PASSWORD);

            await _dbContext.SaveChangesAsync();

            AuthResponseDto data = new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
            };

            apiResponse.Data = data;
            await _auditTrailService.Create(new AuditTrailDto
            {
                RecordId = user.Email ?? "",
                Description = $"{user.Email} has registed successfully with Google!",
                ChangedColumns = "",
                OldValues = ""
            });
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

        public async Task<ApiResponse<string>> DeleteUser(string id)
        {
            ApiResponse<string> apiResponse = new ApiResponse<string>();
            List<RequestClient> requestClient = new List<RequestClient>();

            var user = await _userManager.FindByIdAsync(id);

            await _userManager.DeleteAsync(user); 
            return apiResponse;
        }

        public async Task<ApiResponse<string>> GetRegisterCode(string userEmail)
        {
            ApiResponse<string> apiResponse = new ApiResponse<string>();
            List<RequestClient> requestClient = new List<RequestClient>();

            if (TCommonUtils.IsNullOrEmpty(userEmail))
            {
                apiResponse.CatchException(false, "GetRegisterCode.EmailEmpty", requestClient);
                return apiResponse;
            }

            if (!TCommonUtils.IsValidEmailStrict(userEmail))
            {
                apiResponse.CatchException(false, "GetRegisterCode.EmailIsNotValid", requestClient);
                return apiResponse;
            }

            // check domain email valid
            bool checkIsDomainEmailValid = await DomainHasMxRecord(userEmail);

            if (!checkIsDomainEmailValid)
            {
                apiResponse.CatchException(false, "GetRegisterCode.DomainEmailIsNotValid", requestClient);
                return apiResponse;
            }

            // check is account existed
            var user = await _userManager.FindByEmailAsync(userEmail);
            if (user != null)
            {
                apiResponse.CatchException(false, "GetRegisterCode.AccountHasBeenAlreadyExisted", requestClient);
                return apiResponse;
            }

            ///
            await SendTokenMail(
                userEmail,
                ConstValue.TYPE_AUTH_CODE_REGISTER,
                "Angnet | Your register code",
                $"Your register code is: ",
                "no-reply@yourapp.com"
                );
            ///
            return apiResponse;
        }

        public async Task<ApiResponse<RegisterDto>> Register(RegisterDto registerDto)
        {
            ApiResponse<RegisterDto> apiResponse = new ApiResponse<RegisterDto>();
            List<RequestClient> requestClient = new List<RequestClient>();

            var user = new AppUser
            {
                Email = registerDto.Email,
                FullName = registerDto.FullName,
                UserName = registerDto.Email,
                FlagActive = true,
                CreatedDTime = TCommonUtils.DTimeNow(),
                UpdatedDTime = TCommonUtils.DTimeNow()
            };

            // validate password
            var validateResult = await ValidatePasswordAsync(user, registerDto.Password);
            if (!validateResult.Succeeded)
            {
                string errors = string.Join(", ", validateResult.Errors.Select(e => e.Description));
                apiResponse.CatchException(false, errors, requestClient);
                return apiResponse;
            }

            // verify
            GenerationAuthCode? generationAuthCode = await VerifyResetToken(registerDto.Token, registerDto.Email, ConstValue.TYPE_AUTH_CODE_REGISTER);

            if (generationAuthCode == null)
            {
                apiResponse.CatchException(false, "Register.TokenIsNotValidOrExpired", requestClient);
                return apiResponse;
            }

            // create new user
            var result = await _userManager.CreateAsync(user, registerDto.Password);

            if (!result.Succeeded)
            {
                apiResponse.CatchException(false, "Account.OccurErrorWhileCreateNewUser", requestClient);
                var logMsg = $"========REGISTER FAILED: Account.OccurErrorWhileCreateNewUser=======\n user: {user} | password: {registerDto.Password} at DTime: {TCommonUtils.DTimeNow()}";
                _logger.LogWarning(logMsg);

                await _auditTrailService.Create(new AuditTrailDto
                {
                    Level = Domain.Enums.EAuditTrailLevel.ERROR,
                    RecordId = "",
                    Description = logMsg,
                    ChangedColumns = "",
                    OldValues = ""
                });
                return apiResponse;
            }

            if (registerDto.Roles is null)
            {
                string defaultRoleName = "User";
                var isRoleExist = await _roleManager.RoleExistsAsync(defaultRoleName);
                if (!isRoleExist)
                {
                    var createRole = await _roleManager.CreateAsync(new IdentityRole(defaultRoleName));
                }

                await _userManager.AddToRoleAsync(user, defaultRoleName);
            }
            //Không có quyền admin thì không được thêm roles
            //else
            //{
            //    foreach (var role in registerDto.Roles)
            //    {
            //        await _userManager.AddToRoleAsync(user, role);
            //    }
            //}

            await _auditTrailService.Create(new AuditTrailDto
            {
                RecordId = user.Email,
                Description = $"{user.Email} has registed successfully!",
                ChangedColumns = "",
                OldValues = ""
            });

            // send mail notification
            var bodyMail = $@"
                            <!DOCTYPE html>
                            <html lang='en'>
                            <head>
                              <meta charset='UTF-8' />
                              <meta name='viewport' content='width=device-width, initial-scale=1.0' />
                              <style>
                                body {{
                                  font-family: Arial, sans-serif;
                                  background-color: #f9fafb;
                                  margin: 0;
                                  padding: 0;
                                }}
                                .container {{
                                  max-width: 600px;
                                  margin: 40px auto;
                                  background: #ffffff;
                                  border-radius: 8px;
                                  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                                  overflow: hidden;
                                }}
                                .header {{
                                  background: #2563eb;
                                  color: white;
                                  padding: 20px;
                                  text-align: center;
                                }}
                                .header h1 {{
                                  margin: 0;
                                  font-size: 22px;
                                }}
                                .content {{
                                  padding: 30px;
                                  color: #374151;
                                  line-height: 1.6;
                                }}
                                .btn {{
                                  display: inline-block;
                                  margin-top: 20px;
                                  padding: 12px 20px;
                                  background: #2563eb;
                                  color: white;
                                  text-decoration: none;
                                  border-radius: 6px;
                                  font-weight: bold;
                                }}
                                .footer {{
                                  text-align: center;
                                  font-size: 12px;
                                  color: #6b7280;
                                  padding: 20px;
                                  background: #f3f4f6;
                                }}
                              </style>
                            </head>
                            <body>
                              <div class='container'>
                                <div class='header'>
                                  <h1>Welcome to AngNet System 🚀</h1>
                                </div>
                                <div class='content'>
                                  <p>Hi <strong>{registerDto.FullName}</strong>,</p>
                                  <p>We’re excited to have you on board! Your account has been created successfully. 
                                     From now on, you can log in and start exploring our platform.</p>
                                  <p>To get started, simply click the button below:</p>
                                  <p>
                                    <a href='https://angnet.example.com/login' class='btn'>Login to Your Account</a>
                                  </p>
                                  <p>If you did not create this account, please ignore this email.</p>
                                  <p>Best regards,<br/>The AngNet Team</p>
                                </div>
                                <div class='footer'>
                                  © 2025 AngNet. All rights reserved.<br/>
                                  This is an automated message, please do not reply.
                                </div>
                              </div>
                            </body>
                            </html>
                                ";

            var email = new EmailMessageModel
            {
                From = "phanthang97202@gmail.com",
                To = registerDto.Email,
                Subject = "Welcome to AngNet System",
                Body = bodyMail,
                FromHtml = "phanthang97202@gmail.com",
                ToHtml = registerDto.Email
            };

            await _rbmqEmailProducer.Publish(email);

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
                                .ExecuteUpdateAsync(setter =>
                                                                        setter.SetProperty(r => r.IsRevoked, true)
                                                                      );
            await _dbContext.SaveChangesAsync();

            apiResponse.Data = "LogoutFromAllDeviceSuccessfully!";
            return apiResponse;
        }

        public async Task<ApiResponse<string>> ForgotPassword(string userEmail)
        {
            ApiResponse<string> apiResponse = new ApiResponse<string>();
            List<RequestClient> requestClient = new List<RequestClient>();

            if(TCommonUtils.IsNullOrEmpty(userEmail))
            {
                apiResponse.CatchException(false, "ForgotPassword.EmailEmpty", requestClient);
                return apiResponse;
            }

            if (!TCommonUtils.IsValidEmailStrict(userEmail))
            {
                apiResponse.CatchException(false, "ForgotPassword.EmailIsNotValid", requestClient);
                return apiResponse;
            }

            // check domain email valid
            bool checkIsDomainEmailValid = await DomainHasMxRecord(userEmail);

            if (!checkIsDomainEmailValid)
            {
                apiResponse.CatchException(false, "GetRegisterCode.DomainEmailIsNotValid", requestClient);
                return apiResponse;
            }

            var user = await _userManager.FindByEmailAsync(userEmail);

            if (user == null)
            {
                apiResponse.CatchException(false, "ForgotPassword.UserNotFound", requestClient);
                return apiResponse;
            }

            // Thừa
            if (user.Email != userEmail)
            {
                apiResponse.CatchException(false, "ForgotPassword.AreYouSureYourAccount :)))", requestClient);
                return apiResponse;
            }

            ///
            await SendTokenMail(
                userEmail,
                ConstValue.TYPE_AUTH_CODE_FORGOT_PASSWORD,
                "Angnet | Reset your password",
                $"Your reset code is: ",
                "no-reply@yourapp.com"
                );
            ///
            return apiResponse;
        }

        public async Task DisableAllTokenNotUse(string userEmail, string type)
        {
            // disable tất cả token cũ
            await _dbContext.GenerationAuthCode
                    .Where(x => x.UserId == userEmail && x.Type == type && !x.IsUsed)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(p => p.IsUsed, true)
                        .SetProperty(p => p.UpdatedDTime, TCommonUtils.DTimeNow())
                        .SetProperty(p => p.UpdatedBy, userEmail)
                        );
        }

        public async Task SendTokenMail(string userEmail, string type, string subject, string body, string from)
        {
            await DisableAllTokenNotUse(userEmail, type);

            var (tokenRaw, token, salt) = GenerateResetToken();
            var resetToken = new GenerationAuthCode
            {
                UserId = userEmail,
                Type = type,
                Token = token,
                FlagActive = true,
                IsUsed = false,
                Salt = salt,
                ExpiredAt = TCommonUtils.DTimeAddMinute(5), // 5 phút

                CreatedBy = userEmail,
                CreatedDTime = TCommonUtils.DTimeNow(),
                UpdatedBy = "",
                UpdatedDTime = TCommonUtils.DTimeNow(),
            };

            await _dbContext.GenerationAuthCode.AddAsync(resetToken);
            await _dbContext.SaveChangesAsync();

            // Publish RabbitMQ event
            var email = new EmailMessageModel
            {
                To = userEmail,
                Subject = subject,
                Body =$"{body} <b>{ tokenRaw }</b>",
                From = from
            };
            await _rbmqEmailProducer.Publish(email);

            // log
            await _auditTrailService.Create(new AuditTrailDto
            {
                RecordId = "",
                Description = $"Type: {type} - {userEmail} has just sent code to your gmail",
                ChangedColumns = "",
                OldValues = ""
            });
        }

        public async Task<ApiResponse<string>> ChangePassword(ChangePassDto changePass)
        {
            ApiResponse<string> apiResponse = new ApiResponse<string>();
            List<RequestClient> requestClient = new List<RequestClient>();

            string token = changePass.Token;
            string userEmail = changePass.Email;
            string newPassword = changePass.NewPassword;
            string oldPassword = changePass.OldPassword;

            GenerationAuthCode? generationAuthCode = await VerifyResetToken(token, userEmail, ConstValue.TYPE_AUTH_CODE_FORGOT_PASSWORD);

            if (generationAuthCode == null)
            {
                apiResponse.CatchException(false, "ChangePassword.TokenIsNotValidOrExpired", requestClient);
                return apiResponse;
            }

            if(generationAuthCode.UserId != userEmail)
            {
                apiResponse.CatchException(false, "ChangePassword.DoYouSureYourAccount^^", requestClient);
                return apiResponse;
            }

            var user = await _userManager.FindByEmailAsync(userEmail);
            if (user == null)
            {
                apiResponse.CatchException(false, "ChangePassword.UserIsNotExist", requestClient);
                return apiResponse;
            }

            var result = await _userManager.RemovePasswordAsync(user);

            if (result.Succeeded)
            {
                var changedPass = await _userManager.AddPasswordAsync(user, newPassword);

                if (!changedPass.Succeeded)
                {
                    string msg = string.Join(", ", changedPass.Errors.Select(x => x.Description));
                    apiResponse.CatchException(false, $"ChangePassword. {msg}", requestClient);
                    return apiResponse;
                } 

                // logout all device
                await LogoutAllDevice(user.Id);

                await _dbContext.SaveChangesAsync();

                // log
                await _auditTrailService.Create(new AuditTrailDto
                {
                    RecordId = "",
                    Description = $"{userEmail}: changed password successfully | ({userEmail}, {ConstValue.TYPE_AUTH_CODE_FORGOT_PASSWORD})",
                    ChangedColumns = "",
                    OldValues = ""
                });
            }

            return apiResponse;

        }

        // check MX record của domain để loại những email giả
        public async Task<bool> DomainHasMxRecord(string email)
        {
            var domain = email.Split('@').Last();
            var lookup = new LookupClient();
            var result = await lookup.QueryAsync(domain, QueryType.MX);
            return result.Answers.MxRecords().Any();
        }

        public async Task<GenerationAuthCode?> VerifyResetToken(string token, string userEmail, string type)
        {
            if (TCommonUtils.IsNullOrEmpty(token) || TCommonUtils.IsNullOrEmpty(userEmail))
            {
                return null;
            }

            // Lấy token đang còn hiệu lực
            var generationAuthCode = await _dbContext.GenerationAuthCode
                .FirstOrDefaultAsync(x => x.UserId == userEmail && x.IsUsed == false && x.Type == type);

            if (generationAuthCode == null || generationAuthCode.ExpiredAt < TCommonUtils.DTimeNow())
            {
                await _auditTrailService.Create(new AuditTrailDto
                {
                    Level = Domain.Enums.EAuditTrailLevel.ERROR,
                    RecordId = "",
                    Description = $"{userEmail}: token is not valid or expired | ({token}, {userEmail}, {type})",
                    ChangedColumns = "",
                    OldValues = ""
                });
                return null;
            }

            if (generationAuthCode.AttemptCount >= 5)
            {
                generationAuthCode.IsUsed = true; // block luôn
                generationAuthCode.UpdatedDTime = TCommonUtils.DTimeNow();
                await _dbContext.SaveChangesAsync();
                return null;
            }

            string hash = ComputeSha256(token + generationAuthCode.Salt);

            if (!CryptographicEquals(hash, generationAuthCode.Token))
            {
                generationAuthCode.AttemptCount += 1;
                generationAuthCode.UpdatedDTime = TCommonUtils.DTimeNow();
                await _dbContext.SaveChangesAsync();
                return null;
            }

            // chống được race condition (khi >= 2 request cùng gửi dữ liệu cùng lúc)
            // 🔑 Atomic update: chỉ request này mới đánh dấu được IsUsed = true
            int rows = await _dbContext.GenerationAuthCode
                .Where(x => x.Id == generationAuthCode.Id && x.IsUsed == false)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(p => p.IsUsed, true)
                    .SetProperty(p => p.UpdatedDTime, TCommonUtils.DTimeNow())
                    .SetProperty(p => p.UpdatedBy, userEmail));

            if (rows == 0)
            {
                // Nghĩa là request khác đã update trước đó
                return null;
            }

            await _auditTrailService.Create(new AuditTrailDto
            {
                RecordId = "",
                Description = $"{userEmail}: verify token successfully | ({userEmail}, {type})",
                ChangedColumns = "",
                OldValues = ""
            });

            return generationAuthCode;
        }


        private bool CryptographicEquals(string a, string b)
        {
            var ba = Encoding.UTF8.GetBytes(a);
            var bb = Encoding.UTF8.GetBytes(b);

            uint diff = (uint)ba.Length ^ (uint)bb.Length;
            for (int i = 0; i < ba.Length && i < bb.Length; i++)
                diff |= (uint)(ba[i] ^ bb[i]);

            return diff == 0;
        }

        public (string TokenRaw, string TokenHash, string Salt) GenerateResetToken()
        {
            string tokenRaw = RandomNumberGenerator.GetInt32(100000, 999999).ToString(); // 6 số
            string salt = Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));
            string tokenHash = ComputeSha256(tokenRaw + salt);

            return (tokenRaw, tokenHash, salt);
        }

        private string ComputeSha256(string rawData)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(rawData));
            return Convert.ToBase64String(bytes);
        }

        private async Task<IdentityResult> ValidatePasswordAsync(AppUser user, string password)
        {
            foreach (var validator in _userManager.PasswordValidators)
            {
                var result = await validator.ValidateAsync(_userManager, user, password);
                if (!result.Succeeded)
                {
                    return result;
                }
            }
            return IdentityResult.Success;
        }

    }
}
