using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Google.Apis.Auth;
using DocumentFormat.OpenXml.Spreadsheet;
using angnet.Application.Interfaces.Repositories;

using Microsoft.AspNetCore.RateLimiting;
using angnet.Infrastructure.Mail.Service;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Threading.RateLimiting;

namespace angnet.WebApi.Controllers
{
    // Per-account limit complements the per-IP recovery policy.
    internal static class RecoveryThrottle
    {
        internal static readonly PartitionedRateLimiter<string> Limiter = PartitionedRateLimiter.Create<string, string>(key =>
            RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 2, Window = TimeSpan.FromMinutes(5), QueueLimit = 0, AutoReplenishment = true
            }));
    }

    // [EnableCors("angularapp")]
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly IAccountRespository _accountRespository;

        public AccountController(
            IAccountRespository accountRespository
            , UserManager<AppUser> userManager
            , RoleManager<IdentityRole> roleManager
            , IConfiguration configuration)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _accountRespository = accountRespository;
        }

        [AllowAnonymous]
        [HttpGet("getregistercode")]
        [EnableRateLimitingAttribute("API")]
        public ActionResult<RegisterDto> GetRegisterCode(string email)
        {
            return StatusCode(403, new ApiResponse<string>("Đăng ký bằng mật khẩu đã tắt. Hãy đăng nhập Google hoặc liên hệ quản trị viên."));
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("deleteuser")]
        [EnableRateLimitingAttribute("API")]
        public async Task<ActionResult<RegisterDto>> DeleteUser(string id)
        {
            try
            {
                ApiResponse<string> response = await _accountRespository.DeleteUser(id);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AllowAnonymous]
        [HttpPost("register")]
        [EnableRateLimitingAttribute("API")]
        public ActionResult<RegisterDto> Register(RegisterDto registerDto)
        {
            return StatusCode(403, new ApiResponse<RegisterDto>("Chỉ quản trị viên được tạo tài khoản bằng mật khẩu. Bạn vẫn có thể đăng nhập Google."));
        }

        [AllowAnonymous]
        [HttpPost("login")]
        [EnableRateLimitingAttribute("API")]
        // login 
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
        {
            try
            {
                ApiResponse<AuthResponseDto> response = await _accountRespository.Login(loginDto);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AllowAnonymous]
        [HttpPost("login-google")]
        public async Task<IActionResult> LoginWithGoogle([FromBody] GoogleLoginDto loginGoogleDto)
        {
            try
            {
                ApiResponse<AuthResponseDto> response = await _accountRespository.LoginWithGoogle(loginGoogleDto);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AllowAnonymous]
        [HttpPost("refreshtoken")]
        public async Task<ActionResult<AuthResponseDto>> RefreshToken(RefreshTokenDto refreshTokenDto)
        {
            try
            {
                ApiResponse<AuthResponseDto> response = await _accountRespository.RefreshToken(refreshTokenDto);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [Authorize]
        [HttpPost("logoutalldevice")]
        public async Task<ActionResult<string>> LogoutAllDevice(string userId)
        {
            var actorId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(actorId) || (actorId != userId && !User.IsInRole("Admin")))
                return Forbid();
            try
            {
                ApiResponse<string> response = await _accountRespository.LogoutAllDevice(userId);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [Authorize]
        [HttpPost("me/revoke-sessions")]
        public Task<IActionResult> RevokeOwnSessions() => ProtectOwnAccount(false);

        [Authorize]
        [HttpPost("me/lock")]
        public Task<IActionResult> LockOwnAccount() => ProtectOwnAccount(true);

        private async Task<IActionResult> ProtectOwnAccount(bool locked)
        {
            if (string.IsNullOrWhiteSpace(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value))
                return Unauthorized();
            try
            {
                var response = await _accountRespository.ProtectOwnAccount(User, locked);
                return response.Success ? Ok(response) : BadRequest(response);
            }
            catch (InvalidOperationException)
            {
                return StatusCode(503, new ApiResponse<string>("Không thể cập nhật bảo mật tài khoản. Vui lòng thử lại."));
            }
        }

        // detail user
        [Authorize]
        [HttpGet("detail")]
        public async Task<ActionResult<UserDetailDto>> GetUserDetail()
        {
            try
            {
                ApiResponse<UserDetailDto> response = await _accountRespository.GetUserDetail(User);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [Authorize]
        [HttpPut("avatar")]
        public async Task<IActionResult> UpdateAvatar(UpdateAvatarDto request)
        {
            var response = await _accountRespository.UpdateAvatar(User, request);
            return response.Success ? Ok(response) : BadRequest(response);
        }

        [Authorize]
        [HttpPut("display-name")]
        public async Task<IActionResult> UpdateDisplayName(UpdateDisplayNameDto request)
        {
            var response = await _accountRespository.UpdateDisplayName(User, request);
            return response.Success ? Ok(response) : BadRequest(response);
        }

        // get all users
        [Authorize(Policy = "user.view")]
        [HttpGet("users")]
        public async Task<ActionResult<UserDetailDto>> GetAllUser()
        {
            try
            {
                ApiResponse<UserDetailDto> response = await _accountRespository.GetAllUser(User);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AllowAnonymous]
        [HttpGet("forgotpassword")]
        [EnableRateLimiting("AccountRecoveryIp")]
        public async Task<ActionResult<string>> ForgotPassword(string username)
        {
            // The response is identical for existing and unknown accounts.
            var normalized = (username ?? "").Trim().ToUpperInvariant();
            if (normalized.Length is 0 or > 320)
                return Ok(new ApiResponse<string> { Data = "If the account exists, a recovery code will be sent." });
            using var lease = await RecoveryThrottle.Limiter.AcquireAsync(normalized);
            if (lease.IsAcquired)
            {
                try { await _accountRespository.ForgotPassword((username ?? "").Trim()); }
                catch (Exception) { HttpContext.RequestServices.GetService<ILogger<AccountController>>()?.LogWarning("Password recovery delivery failed"); }
            }
            return Ok(new ApiResponse<string> { Data = "If the account exists, a recovery code will be sent." });
        }

        [AllowAnonymous]
        [HttpPost("changepassword")]
        [EnableRateLimiting("AccountRecoveryIp")]
        public async Task<ActionResult<string>> ChangePassword(ChangePassDto model)
        {
            try
            {
                string token = model.Token;
                string userEmail = model.Email;
                string newPassword = model.NewPassword;
                string oldPassword = model.OldPassword;

                var changePass = new ChangePassDto { 
                    OldPassword = oldPassword,
                    NewPassword = newPassword,
                    Email = userEmail,
                    Token = token
                };


                ApiResponse<string> response = await _accountRespository.ChangePassword(changePass);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }


    }
}
