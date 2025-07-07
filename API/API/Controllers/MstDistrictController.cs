using SharedModels.Dtos;
using SharedModels.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using API.Infrastructure.Data.Services;
using API.Application.Interfaces.Services;
using Microsoft.AspNetCore.RateLimiting;

namespace API.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class MstDistrictController : Controller
    {
        // (Separation of Concerns - SoC) → Controller chỉ nên điều phối yêu cầu,
        // còn Service xử lý logic, Repository thao tác dữ liệu.
        private readonly IMstDistrictService _MstDistrictService;

        public MstDistrictController(IMstDistrictService MstDistrictService)
        {
            _MstDistrictService = MstDistrictService;
        }

        [AllowAnonymous]
        [EnableRateLimitingAttribute("API")]
        [HttpGet("GetAllActive")]
        public async Task<ActionResult<MstDistrictModel>> GetAllActive()
        {
            try
            {
                ApiResponse<MstDistrictModel> response = await _MstDistrictService.GetAllActive();
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] MstDistrictModel reqData)
        {
            try
            {
                ApiResponse<MstDistrictModel> response = await _MstDistrictService.Create(reqData);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}
