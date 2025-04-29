using SharedModels.Dtos;
using SharedModels.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    //[Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class RolesController : ControllerBase
    {
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly UserManager<API.Models.AppUser> _appUser;

        public RolesController(RoleManager<IdentityRole> roleManager, UserManager<API.Models.AppUser> appUser)
        {
            _roleManager = roleManager;
            _appUser = appUser;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleDto createRoleDto)
        {
            // 
            if (string.IsNullOrEmpty(createRoleDto.RoleName))
            {
                return BadRequest(new
                {
                    IsSuccess = false,
                    Message = "RoleName is empty value!"
                });
            }

            // 
            var isRoleExist = await _roleManager.RoleExistsAsync(createRoleDto.RoleName);
            if (isRoleExist)
            {
                return BadRequest(new
                {
                    IsSuccess = false,
                    Message = "Role is already existing"
                });
            }

            //
            var createRole = await _roleManager.CreateAsync(new IdentityRole(createRoleDto.RoleName));
            if (createRole.Succeeded)
            {
                return Ok(new
                {
                    IsSuccess = true,
                    Message = "Creating role successfully!"
                });
            }

            //
            return BadRequest(new
            {
                IsSuccess = false,
                Message = "Role creation failed!"
            });
        }

        [HttpGet("roles")]
        public async Task<IActionResult> GetAllRole()
        {
            // ?o?n này c?ng m?c l?i t??ng t? nh? tr??c: g?i .Result trong m?t bi?u th?c LINQ async (ToListAsync()),
            // s? d?n ??n deadlock ho?c l?i k?t n?i song song trong PostgreSQL v?i EF Core.
            
            //var allRoles = await _roleManager.Roles.Select(r => new RoleResponseDto
            //{
            //    Id = r.Id,
            //    Name = r.Name,
            //    TotalUsers = _appUser.GetUsersInRoleAsync(r.Name!).Result.Count
            //}).ToListAsync();

            var roles = await _roleManager.Roles.ToListAsync();

            var allRoles = new List<RoleResponseDto>();

            foreach (var r in roles)
            {
                var usersInRole = await _appUser.GetUsersInRoleAsync(r.Name!);
                allRoles.Add(new RoleResponseDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    TotalUsers = usersInRole.Count
                });
            }


            return Ok(new
            {
                IsSuccess = true,
                Data = allRoles
            });

        }

        [HttpGet]
        public async Task<IActionResult> DetailRole([FromQuery] string idRole)
        {
            if (!string.IsNullOrEmpty(idRole))
            {
                var role = await _roleManager.FindByIdAsync(idRole);
                if (role != null)
                {
                    return Ok(new
                    {
                        IsSuccess = true,
                        Data = role
                    });
                }
            }

            return BadRequest(new
            {
                IsSuccess = false,
                Message = "Role is not found!"
            });
        }

        [HttpDelete("{idRole}")]
        public async Task<IActionResult> DeleteRole(string idRole)
        {
            if (!string.IsNullOrEmpty(idRole))
            {
                var role = await _roleManager.FindByIdAsync(idRole);
                if (role != null)
                {
                    await _roleManager.DeleteAsync(role);
                    return Ok(new
                    {
                        IsSuccess = true,
                        Message = "Delete role successfully!"
                    });
                }
            }

            return BadRequest(new
            {
                IsSuccess = false,
                Message = "Delete role faild!"
            });
        }

        [HttpPost("assign")]
        public async Task<IActionResult> AssignRole([FromBody] RoleAssignDto assignRole)
        {
            // 
            string idUser = assignRole.UserId;
            string idRole = assignRole.RoleId;

            if (string.IsNullOrEmpty(idRole) || string.IsNullOrEmpty(idUser))
            {
                return BadRequest(new
                {
                    IsSuccess = false,
                    Message = "Faild assign! idRole || idUser is not valid!"
                });
            }

            //
            var user = await _appUser.FindByIdAsync(idUser);
            var role = await _roleManager.FindByIdAsync(idRole);

            if (user == null || role == null)
            {
                return BadRequest(new
                {
                    IsSuccess = false,
                    Message = "Faild assign! user || role is not found!"
                });
            }

            //
            var result = await _appUser.AddToRoleAsync(user, role.Name!);

            if (result.Succeeded)
            {
                return Ok(new
                {
                    IsSuccess = true,
                    Message = "Assign successfully!"
                });
            }

            //
            return BadRequest(new
            {
                IsSuccess = false,
                Message = "Assign role failed!"
            });
        }

        [HttpPost("unassign")]
        public async Task<IActionResult> UnassignRole([FromBody] UnRoleAssignDto unassignRole)
        {
            // 
            string idUser = unassignRole.UserId;
            string idRole = unassignRole.RoleId;

            if (string.IsNullOrEmpty(idRole) || string.IsNullOrEmpty(idUser))
            {
                return BadRequest(new
                {
                    IsSuccess = false,
                    Message = "Faild unassign! idRole || idUser is not valid!"
                });
            }

            //
            var user = await _appUser.FindByIdAsync(idUser);
            var role = await _roleManager.FindByIdAsync(idRole);

            if (user == null || role == null)
            {
                return BadRequest(new
                {
                    IsSuccess = false,
                    Message = "Faild unassign! user || role is not found!"
                });
            }

            //
            var result = await _appUser.RemoveFromRoleAsync(user, role.Name!);

            if (result.Succeeded)
            {
                return Ok(new
                {
                    IsSuccess = true,
                    Message = "Unassign successfully!"
                });
            }

            //
            return BadRequest(new
            {
                IsSuccess = false,
                Message = "Unassign role failed!"
            });
        }

    }
}
