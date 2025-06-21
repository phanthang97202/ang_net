using SharedModels.Dtos;
using SharedModels.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using API.Application.Interfaces.Repositories;
using API.Application.Interfaces.Services;
using API.Infrastructure.Data.Repositories;
using Microsoft.AspNetCore.RateLimiting;

namespace API.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NewsCategoryController : ControllerBase
    {
        private readonly INewsCategoryService _newsCategoryService;
        public NewsCategoryController(INewsCategoryService newsCategoryService)
        {
            _newsCategoryService = newsCategoryService;
        }

        [EnableRateLimitingAttribute("API")]
        [HttpGet("GetAllActive")]
        public async Task<ActionResult<NewsCategoryDto>> GetAllActive()
        {
            try
            {
                ApiResponse<NewsCategoryDto> response = await _newsCategoryService.GetAllActive();
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [Authorize()]
        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] NewsCategoryModel news)
        {
            try
            {
                ApiResponse<NewsCategoryModel> response = await _newsCategoryService.Create(news); 

                return Ok(response);
            }
            catch (Exception)
            { 
                throw;
            }
        }

    }
}
