using System.Security.Claims;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using angnet.WebApi.SignalR;

namespace angnet.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NoteController : ControllerBase
    {
        private readonly INoteService _noteService;
        private readonly IHubContext<NoteHub> _noteHub;
        private readonly ILogger<NoteController> _logger;

        public NoteController(
            INoteService noteService,
            IHubContext<NoteHub> noteHub,
            ILogger<NoteController> logger)
        {
            _noteService = noteService;
            _noteHub = noteHub;
            _logger = logger;
        }

        [AllowAnonymous]
        [EnableRateLimiting("API")]
        [HttpGet("Feed")]
        public async Task<IActionResult> Feed(int pageSize = 10, string cursor = "")
        {
            return Ok(await _noteService.GetPublicFeed(pageSize, cursor));
        }

        [AllowAnonymous]
        [EnableRateLimiting("API")]
        [HttpGet("UnreadState")]
        public async Task<IActionResult> UnreadState(DateTime? lastReadAt = null)
        {
            return Ok(await _noteService.GetUnreadState(lastReadAt));
        }

        [AllowAnonymous]
        [EnableRateLimiting("NoteCreate")]
        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] NoteCreateDto request)
        {
            ApiResponse<NoteDto> response = await _noteService.Create(request);
            if (response.Success)
            {
                try
                {
                    await _noteHub.Clients.All.SendAsync("NoteCreated", response.Data);
                }
                catch (Exception ex)
                {
                    // Ghi chú đã lưu thành công thì không được trả lỗi chỉ vì kênh realtime
                    // đang gián đoạn. Client sẽ đối soát lại số chưa đọc khi kết nối lại.
                    _logger.LogWarning(ex, "Could not broadcast note {NoteId}", response.Data.NoteId);
                }
            }

            return Ok(response);
        }

        [Authorize(Policy = "blog.view")]
        [EnableRateLimiting("API")]
        [HttpGet("AdminSearch")]
        public async Task<IActionResult> AdminSearch(
            int pageIndex = 0, int pageSize = 20, string keyword = "", bool? onlyActive = null)
        {
            return Ok(await _noteService.SearchAdmin(pageIndex, pageSize, keyword, onlyActive));
        }

        [Authorize(Policy = "blog.update")]
        [EnableRateLimiting("API")]
        [HttpPatch("ToggleActive")]
        public async Task<IActionResult> ToggleActive(string noteId, bool flagActive)
        {
            return Ok(await _noteService.ToggleActive(noteId, flagActive, CurrentUserId()));
        }

        [Authorize(Policy = "blog.delete")]
        [EnableRateLimiting("API")]
        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(string noteId)
        {
            return Ok(await _noteService.Delete(noteId));
        }

        private string CurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        }
    }
}
