using API.Dtos;
using API.IRespositories;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion.Internal;

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

        [HttpGet("Search")]
        public async Task<ActionResult<RPNewsDto>> Search(int pageIndex, int pageSize, string keyword, string userId, string categoryId)
        {
            try
            {
                ApiResponse<RPNewsDto> response = await _newsRespository.Search(pageIndex, pageSize, keyword, userId, categoryId);
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
            }
        }

        [HttpGet("Detail")]
        public async Task<ActionResult<RPNewsDto>> Detail(string newsId)
        {
            try
            {
                ApiResponse<RPNewsDto> response = await _newsRespository.Detail(newsId);
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

        [HttpPost("Like")]
        public async Task<IActionResult> Like(string newsId)
        {
            try
            {
                ApiResponse<NewsModel> response = await _newsRespository.Like(User, newsId);
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
            }
        }

        [HttpPost("Point")]
        public async Task<IActionResult> Point(string newsId, double point)
        {
            try
            {
                ApiResponse<NewsModel> response = await _newsRespository.Point(User, newsId, point);
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
            }
        }
    }
}