using API.Dtos;
using API.IRespositories;
using API.Models;
using Microsoft.AspNetCore.Mvc;

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

        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] NewsDto news)
        {
            try
            {
                ApiResponse<NewsModel> response = await _newsRespository.Create(User, news);
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
            }
        }

    }
}