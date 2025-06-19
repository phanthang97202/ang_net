using SharedModels.Dtos;
using SharedModels.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using API.Application.Interfaces.Repositories;
using API.Application.Interfaces.Services;

namespace API.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class NewsCategoryController : ControllerBase
    {
        private readonly INewsCategoryService _newsCategoryService;
        public NewsCategoryController(INewsCategoryService newsCategoryService)
        {
            _newsCategoryService = newsCategoryService;
        }

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

    }
}
