using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using API.Dtos;
using API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _configuration;

        public AccountController(UserManager<AppUser> userManager, RoleManager<IdentityRole> roleManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<ActionResult<string>> Register(RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = new AppUser
            {
                Email = registerDto.Email,
                FullName = registerDto.FullName,
                UserName = registerDto.Email
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);

            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
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


            // response 
            return Ok(
                new AuthResponseDto
                {
                    IsSuccess = true,
                    Message = "Account Create Successfully!"
                }
            );
        }


        [HttpPost("login")]
        // login 
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userManager.FindByEmailAsync(loginDto.Email);

            if (user is null)
            {
                return Unauthorized(
                    new AuthResponseDto
                    {
                        IsSuccess = false,
                        Message = "User hasn't found !"
                    }
                );
            }

            var result = await _userManager.CheckPasswordAsync(user, loginDto.Password);

            if (!result)
            {
                return Unauthorized(
                    new AuthResponseDto
                    {
                        IsSuccess = false,
                        Message = "Invalid password !"
                    }
                );
            }

            var token = GenerateToken(user);

            return Ok(
                new AuthResponseDto
                {
                    Token = token,
                    IsSuccess = true,
                    Message = "Login Successfully !"
                }
            );
        }

        // gen token
        private string GenerateToken(AppUser user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration.GetSection("JWTSetting").GetSection("securityKey").Value!);

            var roles = _userManager.GetRolesAsync(user).Result;

            List<Claim> claims = [
                new (JwtRegisteredClaimNames.Email, user.Email ?? "") ,
                new (JwtRegisteredClaimNames.Name, user.FullName ?? "") ,
                new (JwtRegisteredClaimNames.NameId, user.Id ?? "") ,
                new (
                    JwtRegisteredClaimNames.Aud,
                    _configuration.GetSection("JWTSetting").GetSection("validAudience").Value!
                ),
                new (
                    JwtRegisteredClaimNames.Iss,
                    _configuration.GetSection("JWTSetting").GetSection("validIssuer").Value!
                )
            ];

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(1),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256
                )
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }

        // detail user
        [Authorize]
        [HttpGet("detail")]
        public async Task<ActionResult<UserDetailDto>> GetUserDetail()
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(currentUserId!);

            if (user == null)
            {
                return NotFound(
                    new AuthResponseDto
                    {
                        IsSuccess = false,
                        Message = "User not found"
                    }
                );
            }

            UserDetailDto result = new UserDetailDto()
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Roles = [.. await _userManager.GetRolesAsync(user)],
                PhoneNumber = user.PhoneNumber,
                PhoneNumberConfirmed = user.PhoneNumberConfirmed,
                AccessFailedCount = user.AccessFailedCount,
            };

            return Ok(result);
        }

        // get all users
        [Authorize]
        [HttpGet("users")]
        public async Task<ActionResult> GetAllUser()
        {

            // có thể thay thế bằng [Authorize(Roles = "Admin")]
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(currentUserId!);
            var roles = await _userManager.GetRolesAsync(user!);
            bool isValid = roles.Contains("Admin");

            if (!isValid)
            {
                return BadRequest("You are not permission!");
            }
            else
            {

                //List<UserDetailDto>
                var result = await _userManager.Users.ToListAsync();
                if (result.Count == 0)
                {
                    return NotFound(
                        new AuthResponseDto
                        {
                            IsSuccess = false,
                            Message = "Empty"
                        }
                    );
                }
                return Ok(result);
            }

        }
    }
}