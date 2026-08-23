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

        // Trước đây để [AllowAnonymous]: service chỉ kiểm tra token hợp lệ nên bất kỳ tài
        // khoản nào cũng tạo được danh mục. Quản trị danh mục là việc của Admin.
        [Authorize(Roles = "Admin")]
        [EnableRateLimitingAttribute("API")]
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

        [Authorize(Roles = "Admin")]
        [EnableRateLimitingAttribute("API")]
        [HttpGet("Search")]
        public ActionResult<NewsCategoryModel> Search(int pageIndex, int pageSize, string keyword)
        {
            try
            {
                ApiResponse<NewsCategoryModel> response = _newsCategoryService.Search(pageIndex, pageSize, keyword);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [Authorize(Roles = "Admin")]
        [EnableRateLimitingAttribute("API")]
        [HttpGet("Detail")]
        public async Task<ActionResult<NewsCategoryModel>> Detail(string newsCategoryId)
        {
            try
            {
                ApiResponse<NewsCategoryModel> response = await _newsCategoryService.Detail(newsCategoryId);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [Authorize(Roles = "Admin")]
        [EnableRateLimitingAttribute("API")]
        [HttpPatch("Update")]
        public async Task<IActionResult> Update([FromBody] NewsCategoryModel data)
        {
            try
            {
                ApiResponse<NewsCategoryModel> response = await _newsCategoryService.Update(data);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [Authorize(Roles = "Admin")]
        [EnableRateLimitingAttribute("API")]
        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(string newsCategoryId)
        {
            try
            {
                ApiResponse<NewsCategoryModel> response = await _newsCategoryService.Delete(newsCategoryId);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}
