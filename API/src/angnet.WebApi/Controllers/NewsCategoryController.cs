using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using angnet.Application.Interfaces.Repositories;
using angnet.Application.Interfaces.Services;
using angnet.Infrastructure.Data.Repositories;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers
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

        [AllowAnonymous]
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

        //[Authorize()]
        [AllowAnonymous]
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
