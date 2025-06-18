using SharedModels.Dtos;
using SharedModels.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using API.Infrastructure.Data.Services;
using API.Application.Interfaces.Services;

namespace API.API.Controllers
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
