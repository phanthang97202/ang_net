using SharedModels.Dtos;
using SharedModels.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using API.Application.Interfaces.Repositories;
using API.Application.Interfaces.Services;

namespace API.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class MstProvinceController : ControllerBase
    {
        private readonly IMstProvinceService _mstProvinceService;
        public MstProvinceController(IMstProvinceService mstProvinceService)
        {
            _mstProvinceService = mstProvinceService;
        }
        [HttpGet("Search")]
        public async Task<ActionResult<MstProvinceModel>> Search(int pageIndex, int pageSize, string keyword)
        {
            try
            {
                ApiResponse<MstProvinceModel> response = await _mstProvinceService.Search(pageIndex, pageSize, keyword);
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
        [HttpGet("GetAllActive")]
        public async Task<ActionResult<MstProvinceModel>> GetAllActive()
        {
            try
            {
                ApiResponse<MstProvinceModel> response = await _mstProvinceService.GetAllActive();
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }
        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] MstProvinceModel province)
        {
            try
            {
                ApiResponse<MstProvinceModel> response = await _mstProvinceService.Create(province);
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

        [HttpGet("ExportExcel")]
        public async Task<IActionResult> ExportExcel()
        {
            try
            {
                byte[] file = await _mstProvinceService.ExportExcel();

                return File(file, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Mst_Province_Data.xlsx");
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while exporting the Excel file.");
            }
        }

        [HttpGet("ExportTemplate")]
        public async Task<IActionResult> ExportTemplate()
        {
            try
            {
                byte[] file = await _mstProvinceService.ExportTemplate();

                return File(file, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Mst_Province_Template.xlsx");
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while exporting the Excel file.");
            }
        }

    }
}