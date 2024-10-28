using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using API.Interfaces;
using API.IRespositories;
using API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace API.Controllers
{
    //[Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class NewsController : ControllerBase
    {
        private readonly INewsRespository _newsRespository;
        public NewsController(INewsRespository newsRespository)
        {
            _newsRespository = newsRespository;
        } 
        [HttpGet("Detail")]
        public async Task<ActionResult<MstProvinceModel>> Detail(string key)
        {
            try
            {
                var response = await _newsRespository.Detail(key);
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
            }
        } 

    }
}