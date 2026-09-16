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

        // Danh sách cho trang quản trị. Dùng chung quyền với tham số hệ thống thay
        // vì seed thêm permission riêng - cùng nhóm "cấu hình/vận hành site", giống
        // cách màn Menu trang chủ đang làm.
        [Authorize(Policy = "sysparameter.view")]
        [HttpGet("Search")]
        public async Task<IActionResult> Search(
            int pageIndex = 0, int pageSize = 20, string keyword = "", bool? onlyActive = null)
        {
            try
            {
                ApiResponse<SubscriberItemDto> response =
                    await _subscriberService.SearchAsync(pageIndex, pageSize, keyword, onlyActive);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        // Gửi mail báo bài mới cho toàn bộ người đang nhận.
        //
        // Quyền RIÊNG chứ không dùng lại blog.update: sửa bài là thao tác trong nội
        // bộ, còn gửi thư hàng loạt là hành động ra ngoài - tới hộp thư người thật,
        // và không thu hồi được. Cộng tác viên được sửa bài không có nghĩa là được
        // phép gửi thư cho toàn bộ người đăng ký.
        [Authorize(Policy = "blog.noticenews")]
        [HttpPost("NotifyNewPost")]
        public async Task<IActionResult> NotifyNewPost(string newsId)
        {
            try
            {
                ApiResponse<NotifyResultDto> response =
                    await _subscriberService.NotifyNewPostAsync(newsId);
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
