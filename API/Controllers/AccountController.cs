using API.Dtos;
using API.IRespositories;
using API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    // [EnableCors("angularapp")]
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly IAccountRespository _accountRespository;

        public AccountController(IAccountRespository accountRespository, UserManager<AppUser> userManager, RoleManager<IdentityRole> roleManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _accountRespository = accountRespository;
        }

        [HttpPost("register")]
        public async Task<ActionResult<RegisterDto>> Register(RegisterDto registerDto)
        {
            try
            {
                ApiResponse<RegisterDto> response = await _accountRespository.Register(registerDto);
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
            }
        }

        [HttpPost("login")]
        // login 
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
        {
            try
            {
                ApiResponse<AuthResponseDto> response = await _accountRespository.Login(loginDto);
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
            }
        }

        [HttpPost("refreshtoken")]
        public async Task<ActionResult<AuthResponseDto>> RefreshToken(RefreshTokenDto refreshTokenDto)
        {
            try
            {
                ApiResponse<AuthResponseDto> response = await _accountRespository.RefreshToken(refreshTokenDto);
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
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
            catch (System.Exception)
            {
                throw;
            }
        }

        // get all users
        [Authorize(Roles = "Admin")]
        [HttpGet("users")]
        public async Task<ActionResult<UserDetailDto>> GetAllUser()
        {
            try
            {
                ApiResponse<UserDetailDto> response = await _accountRespository.GetAllUser(User);
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
            }
        }
    }
}