using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [EnableRateLimitingAttribute("API")]
    public class NewsCommentController : ControllerBase
    {
        private readonly INewsCommentService _newsCommentService;

        public NewsCommentController(INewsCommentService newsCommentService)
        {
            _newsCommentService = newsCommentService;
        }

        [AllowAnonymous]
        [HttpGet("Comments")]
        public async Task<IActionResult> Comments(
            string newsId, int pageIndex, int pageSize, string sort, DateTime? snapshot)
        {
            ApiResponse<NewsCommentDto> response = await _newsCommentService
                    .GetComments(User, newsId, pageIndex, pageSize, sort, snapshot);
            return Ok(response);
        }

        [AllowAnonymous]
        [HttpGet("Replies")]
        public async Task<IActionResult> Replies(string commentId, int pageIndex, int pageSize)
        {
            ApiResponse<NewsCommentDto> response = await _newsCommentService
                    .GetReplies(User, commentId, pageIndex, pageSize);
            return Ok(response);
        }

        [Authorize]
        [HttpPost("Comment")]
        public async Task<IActionResult> Comment([FromBody] NewsCommentCreateDto reqData)
        {
            ApiResponse<NewsCommentDto> response = await _newsCommentService.AddComment(User, reqData);
            return Ok(response);
        }

        [Authorize]
        [HttpPost("Like")]
        public async Task<IActionResult> Like(string commentId)
        {
            ApiResponse<NewsCommentDto> response = await _newsCommentService.ToggleLike(User, commentId);
            return Ok(response);
        }

        [Authorize]
        [HttpPost("Report")]
        public async Task<IActionResult> Report([FromBody] NewsCommentReportCreateDto reqData)
        {
            ApiResponse<NewsCommentDto> response = await _newsCommentService.ReportComment(User, reqData);
            return Ok(response);
        }

        [Authorize]
        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(string commentId)
        {
            ApiResponse<NewsCommentDto> response = await _newsCommentService.DeleteComment(User, commentId);
            return Ok(response);
        }
    }
}
