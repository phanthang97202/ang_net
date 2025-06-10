using SharedModels.Dtos;
using SharedModels.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using API.Infrastructure.Data.Services;

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
