using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;

namespace angnet.WebApi.Controllers
{
    // Cấp controller hạ từ [Authorize(Roles="Admin")] xuống [Authorize] làm lớp đáy,
    // rồi từng endpoint đòi quyền cụ thể: đọc cần role.view, còn tạo/xóa/gán cần
    // role.manage hoặc role.assign. Giữ nguyên Roles="Admin" ở cấp controller thì
    // người được gán role.view vẫn không đọc được gì.
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RolesController : ControllerBase
    {
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly UserManager<AppUser> _appUser;

        public RolesController(RoleManager<IdentityRole> roleManager, UserManager<AppUser> appUser)
        {
            _roleManager = roleManager;
            _appUser = appUser;
        }

        [Authorize(Policy = "role.manage")]
        [HttpPost("create")]
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleDto createRoleDto)
        {
            // 
            if (TCommonUtils.IsNullOrEmpty(createRoleDto.RoleName))
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

        [Authorize(Policy = "role.view")]
        [HttpGet("roles")]
        public async Task<IActionResult> GetAllRole()
        {
            // ?o?n n�y c?ng m?c l?i t??ng t? nh? tr??c: g?i .Result trong m?t bi?u th?c LINQ async (ToListAsync()),
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

        [Authorize(Policy = "role.view")]
        [HttpGet]
        public async Task<IActionResult> DetailRole([FromQuery] string idRole)
        {
            if (!TCommonUtils.IsNullOrEmpty(idRole))
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

        [Authorize(Policy = "role.manage")]
        [HttpDelete("{idRole}")]
        public async Task<IActionResult> DeleteRole(string idRole)
        {
            if (!TCommonUtils.IsNullOrEmpty(idRole))
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

        [Authorize(Policy = "role.assign")]
        [HttpPost("assign")]
        public async Task<IActionResult> AssignRole([FromBody] RoleAssignDto assignRole)
        {
            // 
            string idUser = assignRole.UserId;
            string idRole = assignRole.RoleId;

            if (TCommonUtils.IsNullOrEmpty(idRole) || TCommonUtils.IsNullOrEmpty(idUser))
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

        [Authorize(Policy = "role.assign")]
        [HttpPost("unassign")]
        public async Task<IActionResult> UnassignRole([FromBody] UnRoleAssignDto unassignRole)
        {
            // 
            string idUser = unassignRole.UserId;
            string idRole = unassignRole.RoleId;

            if (TCommonUtils.IsNullOrEmpty(idRole) || TCommonUtils.IsNullOrEmpty(idUser))
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
