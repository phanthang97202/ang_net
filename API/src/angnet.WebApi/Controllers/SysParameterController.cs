using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using angnet.Application.Interfaces.Services;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class SysParameterController : Controller
    {
        //(Separation of Concerns - SoC) → Controller chỉ nên điều phối yêu cầu, còn Service xử lý logic, Repository thao tác dữ liệu.
        private readonly ISysParameterService _sysParameterService;

        public SysParameterController(ISysParameterService sysParameterService)
        {
            _sysParameterService = sysParameterService;
        }

        [EnableRateLimitingAttribute("API")]
        [HttpGet("Search")]
        public ActionResult<SysParameterModel> Search(int pageIndex, int pageSize, string keyword, string category)
        {
            try
            {
                ApiResponse<SysParameterModel> response = _sysParameterService.Search(pageIndex, pageSize, keyword, category);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AllowAnonymous]
        [EnableRateLimitingAttribute("API")]
        [HttpGet("Detail")]
        public async Task<ActionResult<SysParameterModel>> Detail(string key)
        {
            try
            {
                ApiResponse<SysParameterModel> response = await _sysParameterService.Detail(key);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [EnableRateLimitingAttribute("API")]
        [HttpGet("GetAllActive")]
        public async Task<ActionResult<SysParameterModel>> GetAllActive()
        {
            try
            {
                ApiResponse<SysParameterModel> response = await _sysParameterService.GetAllActive();
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] SysParameterModel reqData)
        {
            try
            {
                ApiResponse<SysParameterModel> response = await _sysParameterService.Create(reqData);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [HttpPatch("Update")]
        public async Task<IActionResult> Update([FromBody] SysParameterModel reqData)
        {
            try
            {
                ApiResponse<SysParameterModel> response = await _sysParameterService.Update(reqData);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(string ParameterCode)
        {
            try
            {
                ApiResponse<SysParameterModel> response = await _sysParameterService.Delete(ParameterCode);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}
