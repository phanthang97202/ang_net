using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TenantController : ControllerBase
    {
        private readonly ITenantService _tenantService;
        private ILogger<TenantController> _logger;
        public TenantController(ITenantService tenantService, ILogger<TenantController> logger)
        {
            _tenantService = tenantService;
            _logger = logger;
        }

        [AllowAnonymous]
        [EnableRateLimitingAttribute("API")]
        [HttpGet("Search")]
        public ActionResult<TenantModel> Search(int pageIndex, int pageSize, string keyword)
        {
            try
            {
                ApiResponse<TenantModel> response = _tenantService.Search(pageIndex, pageSize, keyword);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }
        [HttpGet("Detail")]
        public async Task<ActionResult<TenantModel>> Detail(string key)
        {
            try
            {
                ApiResponse<TenantModel> response = await _tenantService.Detail(key);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AllowAnonymous]
        [EnableRateLimitingAttribute("API")]
        [HttpGet("GetAllActive")]
        public async Task<ActionResult<TenantModel>> GetAllActive()
        {
            try
            {
                ApiResponse<TenantModel> response = await _tenantService.GetAllActive();
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogDebug($"==========GetAllActive==================\nCancellationToken excuted!! {ex.Message}");
                throw;
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] TenantModel model)
        {
            try
            {
                ApiResponse<TenantModel> response = await _tenantService.Create(model);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPatch("Update")]
        public async Task<IActionResult> Update([FromBody] TenantUpdateDto province)
        {
            try
            {
                ApiResponse<TenantUpdateDto> response = await _tenantService.Update(province);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(string code)
        {
            try
            {
                ApiResponse<TenantModel> response = await _tenantService.Delete(code);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}
