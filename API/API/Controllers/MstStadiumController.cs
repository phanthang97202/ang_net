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
    public class MstStadiumController : Controller
    {
        //(Separation of Concerns - SoC) → Controller chỉ nên điều phối yêu cầu, còn Service xử lý logic, Repository thao tác dữ liệu.
        private readonly MstStadiumService _MstStadiumService;

        public MstStadiumController(MstStadiumService MstStadiumService)
        {
            _MstStadiumService = MstStadiumService;
        }

        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] MstStadiumModel reqData)
        {
            try
            {
                ApiResponse<MstStadiumModel> response = await _MstStadiumService.Create(reqData);
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
        public async Task<ActionResult<MstStadiumModel>> GetAllActive()
        {
            try
            {
                ApiResponse<MstStadiumModel> response = await _MstStadiumService.GetAllActive();
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}
