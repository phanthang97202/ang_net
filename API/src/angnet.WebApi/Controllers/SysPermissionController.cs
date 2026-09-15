using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers
{
    /*
        Quản trị danh mục quyền và việc gán quyền vào vai trò.

        Vẫn để [Authorize(Roles = "Admin")] như RolesController: bước này mới dựng nền,
        chưa chuyển endpoint nào sang [Authorize(Policy = "...")]. Đổi sang policy là
        việc của bước áp dụng sau - làm sớm mà seed thiếu quyền thì chính màn hình
        phân quyền lại là thứ khoá mình ra ngoài đầu tiên.
    */
    [Authorize(Roles = "Admin")]
    [Route("api/[controller]")]
    [ApiController]
    public class SysPermissionController : ControllerBase
    {
        private readonly ISysPermissionService _sysPermissionService;

        public SysPermissionController(ISysPermissionService sysPermissionService)
        {
            _sysPermissionService = sysPermissionService;
        }

        /// <summary>Danh mục quyền của hệ thống, đã gom nhóm theo module.</summary>
        [EnableRateLimitingAttribute("API")]
        [HttpGet("Catalogue")]
        public async Task<IActionResult> GetCatalogue()
        {
            try
            {
                ApiResponse<PermissionModuleDto> response = await _sysPermissionService.GetCatalogue();
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        /// <summary>Các mã quyền đang gán cho một vai trò.</summary>
        [EnableRateLimitingAttribute("API")]
        [HttpGet("OfRole")]
        public async Task<IActionResult> GetPermissionsOfRole(string roleId)
        {
            try
            {
                ApiResponse<RolePermissionDto> response = await _sysPermissionService.GetPermissionsOfRole(roleId);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        /// <summary>Thay toàn bộ quyền của một vai trò bằng danh sách mới.</summary>
        [EnableRateLimitingAttribute("API")]
        [HttpPost("UpdateOfRole")]
        public async Task<IActionResult> UpdatePermissionsOfRole([FromBody] RolePermissionUpdateDto reqData)
        {
            try
            {
                ApiResponse<RolePermissionDto> response = await _sysPermissionService.UpdatePermissionsOfRole(reqData);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}
