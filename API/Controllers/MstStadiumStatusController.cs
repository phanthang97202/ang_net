using SharedModels.Dtos;
using SharedModels.Models;
using API.UnitOfWork.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class MstStadiumStatusController : Controller
    {
        //(Separation of Concerns - SoC) → Controller chỉ nên điều phối yêu cầu, còn Service xử lý logic, Repository thao tác dữ liệu.
        private readonly MstStadiumStatusService _mstStadiumStatusService;
        
        public MstStadiumStatusController(MstStadiumStatusService mstStadiumStatusService)
        {
            _mstStadiumStatusService = mstStadiumStatusService;
        }

        [HttpGet("GetAllStadiumStatus")]
        public async Task<ActionResult<MstStadiumStatusModel>> GetAllStadiumStatus()
        {
            try
            {
                ApiResponse<MstStadiumStatusModel> response = await _mstStadiumStatusService.GetAllStadiumStatus();
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
            }
        }
    }
}
