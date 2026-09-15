using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers
{
    /*
        Quản trị danh mục quyền và việc gán quyền vào vai trò.

        Đọc danh mục và xem quyền của vai trò cần role.view - khớp với quyền mở trang
        /dashboard/role. Thay quyền của vai trò thì cần role.manage.

        Cấp controller giữ [Authorize] làm lớp đáy: thêm endpoint mới mà quên gắn
        policy thì ít nhất vẫn phải đăng nhập, chứ không hở hẳn ra ngoài.

        Admin đi qua tất cả (PermissionHandler), nên không có chuyện seed thiếu quyền
        rồi tự khoá mình ra khỏi chính màn hình phân quyền.
    */
    [Authorize]
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
        [Authorize(Policy = "role.view")]
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
        [Authorize(Policy = "role.view")]
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
        [Authorize(Policy = "role.manage")]
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
