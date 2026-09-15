using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers
{
    /*
        Quản trị menu điều hướng ngoài trang chủ.

        GetActive là endpoint CÔNG KHAI: navbar phục vụ cả khách chưa đăng nhập, gắn
        [Authorize] vào đó là trang chủ mất sạch menu với người chưa đăng nhập.

        Phần quản trị dùng lại quyền sysparameter.*: menu cũng là một dạng cấu hình
        hệ thống, ai sửa được tham số thì sửa được menu. Không đặt quyền riêng để
        khỏi phải seed thêm.
    */
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class SysMenuController : ControllerBase
    {
        private readonly ISysMenuService _sysMenuService;

        public SysMenuController(ISysMenuService sysMenuService)
        {
            _sysMenuService = sysMenuService;
        }

        /// <summary>Menu đang bật, dạng cây - cho navbar ngoài trang chủ.</summary>
        [AllowAnonymous]
        [EnableRateLimitingAttribute("API")]
        [HttpGet("GetActive")]
        public async Task<IActionResult> GetActive()
        {
            try
            {
                ApiResponse<SysMenuTreeDto> response = await _sysMenuService.GetActiveTree();
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        /// <summary>Toàn bộ menu kể cả đang tắt - cho màn quản trị.</summary>
        [Authorize(Policy = "sysparameter.view")]
        [EnableRateLimitingAttribute("API")]
        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                ApiResponse<SysMenuTreeDto> response = await _sysMenuService.GetAllTree();
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [Authorize(Policy = "sysparameter.create")]
        [EnableRateLimitingAttribute("API")]
        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] SysMenuSaveDto reqData)
        {
            try
            {
                ApiResponse<SysMenuSaveDto> response = await _sysMenuService.Create(reqData);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [Authorize(Policy = "sysparameter.update")]
        [EnableRateLimitingAttribute("API")]
        [HttpPatch("Update")]
        public async Task<IActionResult> Update([FromBody] SysMenuSaveDto reqData)
        {
            try
            {
                ApiResponse<SysMenuSaveDto> response = await _sysMenuService.Update(reqData);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        /// <summary>Bật/tắt nhanh một mục menu, khỏi phải gửi cả bản ghi.</summary>
        [Authorize(Policy = "sysparameter.update")]
        [EnableRateLimitingAttribute("API")]
        [HttpPatch("ToggleActive")]
        public async Task<IActionResult> ToggleActive(string menuId, bool flagActive)
        {
            try
            {
                ApiResponse<SysMenuSaveDto> response = await _sysMenuService.ToggleActive(menuId, flagActive);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [Authorize(Policy = "sysparameter.delete")]
        [EnableRateLimitingAttribute("API")]
        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(string menuId)
        {
            try
            {
                ApiResponse<SysMenuSaveDto> response = await _sysMenuService.Delete(menuId);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}
