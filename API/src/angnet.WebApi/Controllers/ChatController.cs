using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using angnet.Application.Interfaces.Repositories;
using Microsoft.AspNetCore.Authorization;
using angnet.WebApi.SignalR;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.SignalR;
using angnet.Infrastructure.Data.Services;

namespace angnet.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = "chat.view")]
    public class ChatController : ControllerBase
    {
        private readonly IChatRepository _chatRepository;
        public ChatController(IChatRepository chatRepository)
        {
            _chatRepository = chatRepository;
        }

        [HttpGet("GetMessage")]
        public async Task<ActionResult<ChatModel>> GetMessage(int PageIndex = 0, int PageSize = 10, long? BeforeSequence = null)
        {
            if (PageIndex < 0 || PageSize is < 1 or > 100) return BadRequest();
            if (BeforeSequence is <= 0) return BadRequest();
            try
            {
                ApiResponse<ChatModel> response = await _chatRepository.GetMessage(PageIndex, PageSize, BeforeSequence);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [HttpGet("notifications")]
        public async Task<IActionResult> Notifications() => Ok(await _chatRepository.Notifications(ChatIdentity.AccountId(User), ChatIdentity.Key(User)));

        [HttpPost("read")]
        public async Task<IActionResult> MarkRead(ChatReadDto request) => Ok(await _chatRepository.MarkRead(ChatIdentity.AccountId(User), ChatIdentity.Key(User), request.Sequence));

        [Authorize(Policy = "chat.delete")]
        [HttpDelete("{messageId}")]
        public async Task<IActionResult> DeleteMessage(string messageId,
            [FromServices] IHubContext<ChatHub> hub,
            [FromServices] ChatConnections connections,
            [FromServices] AccountSessionService sessions,
            [FromServices] IAuthorizationService authorization)
        {
            var response = await _chatRepository.SoftDelete(messageId, ChatIdentity.AccountId(User));
            if (!response.Success) return NotFound(response);
            var recipients = await connections.Recipients(sessions, authorization);
            await hub.Clients.Clients(recipients).SendAsync("MessageDeleted", response.Data);
            return Ok(response);
        }

        [Authorize(Policy = "chat.send")]
        [Authorize(Policy = "chat.send_image")]
        [EnableRateLimiting("API")]
        [HttpPost("image")]
        [RequestSizeLimit(3 * 1024 * 1024)]
        [RequestFormLimits(MultipartBodyLengthLimit = 3 * 1024 * 1024)]
        public async Task<IActionResult> SendImage([FromForm] IFormFile file, CancellationToken cancellationToken,
            [FromServices] IHubContext<ChatHub> hub,
            [FromServices] ChatConnections connections,
            [FromServices] AccountSessionService sessions,
            [FromServices] IAuthorizationService authorization)
        {
            if (file == null || file.Length == 0 || file.Length >= 2 * 1024 * 1024)
                return BadRequest(new ApiResponse<ChatModel>("Ảnh phải có dung lượng nhỏ hơn 2 MB."));
            var contentTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
            if (!contentTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase))
                return BadRequest(new ApiResponse<ChatModel>("Chỉ hỗ trợ ảnh JPG, PNG, GIF hoặc WebP."));

            using var buffer = new MemoryStream();
            await file.CopyToAsync(buffer, cancellationToken);
            var bytes = buffer.ToArray();
            var contentType = file.ContentType.ToLowerInvariant();
            if (!IsImage(bytes, contentType))
                return BadRequest(new ApiResponse<ChatModel>("Dữ liệu ảnh không hợp lệ."));

            var response = await _chatRepository.SendImage(ChatIdentity.Key(User), bytes, contentType);
            if (!response.Success) return BadRequest(response);
            var recipients = await connections.Recipients(sessions, authorization);
            await hub.Clients.Clients(recipients).SendAsync("ReceiveMessage", response.Data);
            return Ok(response);
        }

        [HttpGet("{messageId}/image")]
        public async Task<IActionResult> GetImage(string messageId)
        {
            var image = await _chatRepository.GetImage(messageId);
            if (image is null) return NotFound();
            Response.Headers.CacheControl = "no-store";
            Response.Headers["X-Content-Type-Options"] = "nosniff";
            return File(image.Data, image.ContentType);
        }

        private static bool IsImage(byte[] data, string contentType) => contentType switch
        {
            "image/jpeg" => data.AsSpan().StartsWith(new byte[] { 0xff, 0xd8, 0xff }),
            "image/png" => data.AsSpan().StartsWith(new byte[] { 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a }),
            "image/gif" => data.AsSpan().StartsWith("GIF87a"u8) || data.AsSpan().StartsWith("GIF89a"u8),
            "image/webp" => data.Length >= 12 && data.AsSpan(0, 4).SequenceEqual("RIFF"u8)
                && data.AsSpan(8, 4).SequenceEqual("WEBP"u8),
            _ => false
        };
    }
}
