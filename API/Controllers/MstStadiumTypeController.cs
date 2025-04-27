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
    public class MstStadiumTypeController : Controller
    {
        //(Separation of Concerns - SoC) → Controller chỉ nên điều phối yêu cầu, còn Service xử lý logic, Repository thao tác dữ liệu.
        private readonly MstStadiumTypeService _MstStadiumTypeService;

        public MstStadiumTypeController(MstStadiumTypeService MstStadiumTypeService)
        {
            _MstStadiumTypeService = MstStadiumTypeService;
        }

        [HttpGet("GetAllStadiumType")]
        public async Task<ActionResult<MstStadiumTypeModel>> GetAllStadiumType()
        {
            try
            {
                ApiResponse<MstStadiumTypeModel> response = await _MstStadiumTypeService.GetAllStadiumType();
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
            }
        }
    }
}
