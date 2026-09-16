using angnet.Domain.Dtos;
using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [EnableRateLimitingAttribute("API")]
    public class SubscriberController : ControllerBase
    {
        private readonly ISubscriberService _subscriberService;

        public SubscriberController(ISubscriberService subscriberService)
        {
            _subscriberService = subscriberService;
        }

        // AllowAnonymous: khối đăng ký nằm ngoài trang chủ, người đọc không cần tài
        // khoản. Rate limit của controller lo phần chặn spam.
        [AllowAnonymous]
        [HttpPost("Subscribe")]
        public async Task<IActionResult> Subscribe([FromBody] SubscribeRequestDto request)
        {
            try
            {
                ApiResponse<SubscribeResultDto> response =
                    await _subscriberService.SubscribeAsync(request?.Email);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        // GET chứ không POST: đây là link bấm thẳng từ hộp thư.
        [AllowAnonymous]
        [HttpGet("Unsubscribe")]
        public async Task<IActionResult> Unsubscribe(string token)
        {
            try
            {
                bool done = await _subscriberService.UnsubscribeAsync(token);
                return Ok(new { Success = done });
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}
