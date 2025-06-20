using SharedModels.Dtos;
using SharedModels.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using API.Application.Interfaces.Repositories;
using API.API.Filters;
using API.Shared.Utilities;
using Microsoft.AspNetCore.RateLimiting;

namespace API.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [EnableRateLimitingAttribute("API")]
    public class NewsController : ControllerBase
    {
        private readonly INewsRespository _newsRespository;
        private readonly WriteLog _logger;
        public NewsController(INewsRespository newsRespository, WriteLog logger)
        {
            _newsRespository = newsRespository;
            _logger = logger;
        }

        [HttpGet("Search")]
        public async Task<ActionResult<RPNewsDto>> Search(int pageIndex, int pageSize, string keyword, string userId, string categoryId)
        {
            try
            {
                ApiResponse<RPNewsDto> response = await _newsRespository.Search(pageIndex, pageSize, keyword, userId, categoryId);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [HttpGet("Detail")]
        [SkipLogging]
        public async Task<ActionResult<RPNewsDto>> Detail(string newsId)
        {
            try
            {
                ApiResponse<RPNewsDto> response = await _newsRespository.Detail(newsId);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [Authorize()]
        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] NewsDto news)
        {
            try
            {
                ApiResponse<NewsModel> response = await _newsRespository.Create(User, news);

                _logger.LogInformation("NewsRespository.Create", news, response);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError("NewsRespository.Create", news, ex);
                throw;
            }
        }

        [HttpPost("Like")]
        public async Task<IActionResult> Like(string newsId)
        {
            try
            {
                ApiResponse<NewsModel> response = await _newsRespository.Like(User, newsId);

                _logger.LogInformation("NewsRespository.Create", newsId, response);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError("NewsRespository.Like", newsId, ex);
                throw;
            }
        }

        [HttpPost("Point")]
        public async Task<IActionResult> Point(string newsId, double point)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest();
                }
                ApiResponse<NewsModel> response = await _newsRespository.Point(User, newsId, point);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}