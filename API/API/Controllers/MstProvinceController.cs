using SharedModels.Dtos;
using SharedModels.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using API.Application.Interfaces.Repositories;
using API.Application.Interfaces.Services;
using Microsoft.AspNetCore.RateLimiting;

namespace API.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class MstProvinceController : ControllerBase
    {
        private readonly IMstProvinceService _mstProvinceService;
        private ILogger<MstProvinceController> _logger;
        public MstProvinceController(IMstProvinceService mstProvinceService, ILogger<MstProvinceController> logger)
        {
            _mstProvinceService = mstProvinceService;
            _logger = logger;
        }

        [AllowAnonymous]
        [EnableRateLimitingAttribute("API")]
        [HttpGet("Search")]
        public ActionResult<MstProvinceModel> Search(int pageIndex, int pageSize, string keyword)
        {
            try
            {
                ApiResponse<MstProvinceModel> response = _mstProvinceService.Search(pageIndex, pageSize, keyword);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }
        [HttpGet("Detail")]
        public async Task<ActionResult<MstProvinceModel>> Detail(string key)
        {
            try
            {
                ApiResponse<MstProvinceModel> response = await _mstProvinceService.Detail(key);
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
        public async Task<ActionResult<MstProvinceModel>> GetAllActive()
        {
            try
            { 
                ApiResponse<MstProvinceModel> response = await _mstProvinceService.GetAllActive();
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogDebug($"==========GetAllActive==================\nCancellationToken excuted!! {ex.Message}");
                throw ;
            }
        }
        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] MstProvinceTestDto province)
        {
            try
            {
                ApiResponse<MstProvinceTestDto> response = await _mstProvinceService.Create(province);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [HttpPatch("Update")]
        public async Task<IActionResult> Update([FromBody] MstProvinceModel province)
        {
            try
            {
                ApiResponse<MstProvinceModel> response = await _mstProvinceService.Update(province);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(string ProvinceCode)
        {
            try
            {
                ApiResponse<MstProvinceModel> response = await _mstProvinceService.Delete(ProvinceCode);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [HttpPost("ImportExcel")]
        public async Task<IActionResult> ImportExcel([FromForm] IFormFile file)
        {
            try
            {
                ApiResponse<MstProvinceModel> response = await _mstProvinceService.ImportExcel(file);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AllowAnonymous]
        [EnableRateLimitingAttribute("API")]
        [HttpGet("ExportExcel")]
        public async Task<IActionResult> ExportExcel()
        {
            try
            {
                byte[] file = await _mstProvinceService.ExportExcel();

                return File(file, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Mst_Province_Data.xlsx");
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while exporting the Excel file.");
            }
        }

        [AllowAnonymous]
        [EnableRateLimitingAttribute("API")]
        [HttpGet("ExportTemplate")]
        public IActionResult ExportTemplate()
        {
            try
            {
                byte[] file = _mstProvinceService.ExportTemplate();

                return File(file, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Mst_Province_Template.xlsx");
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while exporting the Excel file.");
            }
        }

    }
}