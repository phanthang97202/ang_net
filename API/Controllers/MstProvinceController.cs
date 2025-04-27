using SharedModels.Dtos;
using SharedModels.Models;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class MstProvinceController : ControllerBase
    {
        private readonly IMstProvinceRespository _mstProvinceRespository;
        public MstProvinceController(IMstProvinceRespository mstProvinceRespository)
        {
            _mstProvinceRespository = mstProvinceRespository;
        } 
        [HttpGet("Search")]
        public async Task<ActionResult<MstProvinceModel>> Search(int pageIndex, int pageSize, string keyword)
        {
            try
            {
                ApiResponse<MstProvinceModel> response = await _mstProvinceRespository.Search(pageIndex, pageSize, keyword);
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
            }
        }
        [HttpGet("Detail")]
        public async Task<ActionResult<MstProvinceModel>> Detail(string key)
        {
            try
            {
                ApiResponse<MstProvinceModel> response = await _mstProvinceRespository.Detail(key);
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
            }
        }
        [HttpGet("GetAllActive")]
        public async Task<ActionResult<MstProvinceModel>> GetAllActive()
        {
            try
            {
                ApiResponse<MstProvinceModel> response = await _mstProvinceRespository.GetAllActive();
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
            }
        }
        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] MstProvinceModel province)
        {
            try
            {
                ApiResponse<MstProvinceModel> response = await _mstProvinceRespository.Create(province);
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
            }
        }

        [HttpPatch("Update")]
        public async Task<IActionResult> Update([FromBody] MstProvinceModel province)
        {
            try
            {
                ApiResponse<MstProvinceModel> response = await _mstProvinceRespository.Update(province);
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
            }
        }

        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(string ProvinceCode)
        {
            try
            {
                ApiResponse<MstProvinceModel> response = await _mstProvinceRespository.Delete(ProvinceCode);
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
            }
        }

        [HttpPost("ImportExcel")]
        public async Task<IActionResult> ImportExcel([FromForm] IFormFile file)
        {
            try
            {
                ApiResponse<MstProvinceModel> response = await _mstProvinceRespository.ImportExcel(file);
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
            }
        }

        [HttpGet("ExportExcel")]
        public async Task<IActionResult> ExportExcel()
        {
            try
            {
                byte[] file = await _mstProvinceRespository.ExportExcel();

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
                byte[] file = await _mstProvinceRespository.ExportTemplate();

                return File(file, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Mst_Province_Template.xlsx");
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while exporting the Excel file.");
            }
        }

    }
}