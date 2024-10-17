using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using API.Interfaces;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MstProvinceController : ControllerBase
    {
        private readonly IMstProvinceRespository _mstProvinceRespository;
        public MstProvinceController(IMstProvinceRespository mstProvinceRespository)
        {
            _mstProvinceRespository = mstProvinceRespository;
        }
        [HttpGet]
        public async Task<ActionResult<MstProvinceModel>> GetAllActive()
        {
            try
            {
                var response = await _mstProvinceRespository.GetAllActive();
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
                var response = await _mstProvinceRespository.Create(province);
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
                var response = await _mstProvinceRespository.Update(province);
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
            }
        }

        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete( string ProvinceCode)
        {
            try
            {
                var response = await _mstProvinceRespository.Delete(ProvinceCode);
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
                var response = await _mstProvinceRespository.ImportExcel(file);
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

    }
}