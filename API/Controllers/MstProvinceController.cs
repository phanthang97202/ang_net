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
                List<MstProvinceModel> data = await _mstProvinceRespository.GetAllActive();
                return Ok(new
                {
                    Data = data,
                    Message = "Success"
                });
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
                await _mstProvinceRespository.Create(province);
                return Ok(new {
                    Data = "",
                    Message = "Success"
                });
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
                await _mstProvinceRespository.Update(province);
                return Ok(new
                {
                    Data = "",
                    Message = "Success"
                });
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
                await _mstProvinceRespository.Delete(ProvinceCode);
                return Ok(new
                {
                    Data = "",
                    Message = "Success"
                });
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
                await _mstProvinceRespository.ImportExcel(file);
                return Ok(new
                {
                    Data = "",
                    Message = "Import Excel Successfully!"
                });
            }
            catch (System.Exception)
            {
                throw;
            }
        }
    }
}