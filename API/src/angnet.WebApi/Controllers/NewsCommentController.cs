using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using angnet.Infrastructure.Data;
using angnet.WebApi.SignalR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using angnet.WebApi.Security;

namespace angnet.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [EnableRateLimitingAttribute("API")]
    public class NewsCommentController : ControllerBase
    {
        private readonly INewsCommentService _newsCommentService;
        private readonly ITurnstileVerifier _turnstile;

        public NewsCommentController(INewsCommentService newsCommentService, ITurnstileVerifier turnstile)
        {
            _newsCommentService = newsCommentService;
            _turnstile = turnstile;
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
        [HttpGet("Context")]
        public async Task<IActionResult> Context(string newsId, string commentId) =>
            Ok(await _newsCommentService.GetContext(User, newsId, commentId));

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
        public async Task<IActionResult> Comment([FromBody] NewsCommentCreateDto reqData,
            [FromServices] AppDbContext db, [FromServices] IHubContext<BlogNotificationHub> hub,
            [FromServices] ILogger<NewsCommentController> logger)
        {
            if (reqData is null) return BadRequest(new ApiResponse<NewsCommentDto>("T_COMMENT_CAPTCHA_INVALID"));
            var verification = await _turnstile.VerifyAsync(reqData.TurnstileToken, HttpContext.RequestAborted);
            if (verification != TurnstileResult.Valid)
                return Ok(new ApiResponse<NewsCommentDto>(verification == TurnstileResult.Unavailable
                    ? "T_COMMENT_CAPTCHA_UNAVAILABLE" : "T_COMMENT_CAPTCHA_INVALID"));

            // The service includes request fields in validation errors; never echo a CAPTCHA token.
            reqData.TurnstileToken = string.Empty;
            ApiResponse<NewsCommentDto> response = await _newsCommentService.AddComment(User, reqData);
            if (response.Success && response.Data != null)
            {
                try
                {
                    var recipients = await db.BlogNotification.Where(n => n.CommentId == response.Data.CommentId)
                        .Select(n => n.RecipientId).Distinct().ToListAsync();
                    if (recipients.Count > 0)
                        await hub.Clients.Users(recipients).SendAsync("NotificationsChanged");
                }
                catch (Exception ex)
                {
                    // The comment and notifications are already committed; polling can recover delivery.
                    logger.LogWarning(ex, "Could not broadcast comment notification {CommentId}", response.Data.CommentId);
                }
            }
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
