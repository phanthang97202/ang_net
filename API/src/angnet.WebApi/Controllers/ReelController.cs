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
    public class ReelController : ControllerBase
    {
        private readonly IReelService _reelService;

        public ReelController(IReelService reelService)
        {
            _reelService = reelService;
        }

        [AllowAnonymous]
        [HttpGet("Feed")]
        public async Task<IActionResult> Feed(int pageSize, string cursor)
        {
            ApiResponse<ReelDto> response = await _reelService.GetFeed(User, pageSize, cursor);
            return Ok(response);
        }

        [AllowAnonymous]
        [HttpGet("Detail")]
        public async Task<IActionResult> Detail(string reelId)
        {
            ApiResponse<ReelDto> response = await _reelService.Detail(User, reelId);
            return Ok(response);
        }

        [Authorize]
        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] ReelCreateDto reqData)
        {
            ApiResponse<ReelDto> response = await _reelService.Create(User, reqData);
            return Ok(response);
        }

        [Authorize]
        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(string reelId)
        {
            ApiResponse<ReelDto> response = await _reelService.Delete(User, reelId);
            return Ok(response);
        }

        [Authorize]
        [HttpPost("Like")]
        public async Task<IActionResult> Like(string reelId)
        {
            ApiResponse<ReelDto> response = await _reelService.ToggleLike(User, reelId);
            return Ok(response);
        }

        [AllowAnonymous]
        [HttpGet("Comments")]
        public async Task<IActionResult> Comments(string reelId, int pageSize, string cursor)
        {
            ApiResponse<ReelCommentDto> response = await _reelService.GetComments(User, reelId, pageSize, cursor);
            return Ok(response);
        }

        [AllowAnonymous]
        [HttpGet("Replies")]
        public async Task<IActionResult> Replies(string commentId, int pageSize, string cursor)
        {
            ApiResponse<ReelCommentDto> response = await _reelService.GetReplies(User, commentId, pageSize, cursor);
            return Ok(response);
        }

        [Authorize]
        [HttpPost("Comment")]
        public async Task<IActionResult> Comment([FromBody] ReelCommentCreateDto reqData)
        {
            ApiResponse<ReelCommentDto> response = await _reelService.AddComment(User, reqData);
            return Ok(response);
        }
    }
}
