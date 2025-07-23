using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using angnet.Infrastructure.Data.Services;
using angnet.Application.Interfaces.Services;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class MstStadiumStatusController : Controller
    {
        //(Separation of Concerns - SoC) → Controller chỉ nên điều phối yêu cầu, còn Service xử lý logic, Repository thao tác dữ liệu.
        private readonly IMstStadiumStatusService _MstStadiumStatusService;

        public MstStadiumStatusController(IMstStadiumStatusService mstStadiumStatusService)
        {
            _MstStadiumStatusService = mstStadiumStatusService;
        }

        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] MstStadiumStatusModel reqData)
        {
            try
            {
                ApiResponse<MstStadiumStatusModel> response = await _MstStadiumStatusService.Create(reqData);
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
        public async Task<ActionResult<MstStadiumStatusModel>> GetAllActive()
        {
            try
            {
                ApiResponse<MstStadiumStatusModel> response = await _MstStadiumStatusService.GetAllActive();
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}
