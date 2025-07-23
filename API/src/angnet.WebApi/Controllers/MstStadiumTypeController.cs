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
    public class MstStadiumTypeController : Controller
    {
        //(Separation of Concerns - SoC) → Controller chỉ nên điều phối yêu cầu, còn Service xử lý logic, Repository thao tác dữ liệu.
        private readonly IMstStadiumTypeService _MstStadiumTypeService;

        public MstStadiumTypeController(IMstStadiumTypeService mstStadiumTypeService)
        {
            _MstStadiumTypeService = mstStadiumTypeService;
        }

        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] MstStadiumTypeModel reqData)
        {
            try
            {
                ApiResponse<MstStadiumTypeModel> response = await _MstStadiumTypeService.Create(reqData);
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
        public async Task<ActionResult<MstStadiumTypeModel>> GetAllActive()
        {
            try
            {
                ApiResponse<MstStadiumTypeModel> response = await _MstStadiumTypeService.GetAllActive();
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}
