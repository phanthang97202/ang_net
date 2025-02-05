using API.Dtos;
using API.Interfaces;
using API.IRespositories;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class NewsCategoryController : ControllerBase
    {
        private readonly INewsCategoryRespository _newsCategoryRespository;
        public NewsCategoryController(INewsCategoryRespository newsCategoryRespository)
        {
            _newsCategoryRespository = newsCategoryRespository;
        }
         
        [HttpGet("GetAllActive")]
        public async Task<ActionResult<NewsCategoryDto>> GetAllActive()
        {
            try
            {
                ApiResponse<NewsCategoryDto> response = await _newsCategoryRespository.GetAllActive();
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
            }
        }
         
    }
}
