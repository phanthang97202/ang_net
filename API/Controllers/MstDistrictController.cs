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
    public class MstDistrictController : Controller
    {
        // (Separation of Concerns - SoC) → Controller chỉ nên điều phối yêu cầu,
        // còn Service xử lý logic, Repository thao tác dữ liệu.
        private readonly MstDistrictService _MstDistrictService;

        public MstDistrictController(MstDistrictService MstDistrictService)
        {
            _MstDistrictService = MstDistrictService;
        }

        [HttpGet("GetAllActive")]
        public async Task<ActionResult<MstDistrictModel>> GetAllActive()
        {
            try
            {
                ApiResponse<MstDistrictModel> response = await _MstDistrictService.GetAllActive();
                return Ok(response);
            }
            catch (System.Exception)
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
            catch (System.Exception)
            {
                throw;
            }
        }
    }
}
