using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using angnet.Application.Interfaces.Repositories;
using Microsoft.AspNetCore.Authorization;
using angnet.WebApi.SignalR;
using angnet.WebApi.Cloudinary;
using Microsoft.AspNetCore.RateLimiting;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace angnet.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = "chat.view")]
    public class ChatController : ControllerBase
    {
        private readonly IChatRepository _chatRepository;
        private readonly IHttpClientFactory _httpClients;
        private readonly IConfiguration _configuration;
        public ChatController(IChatRepository chatRepository, IHttpClientFactory httpClients, IConfiguration configuration)
        {
            _chatRepository = chatRepository;
            _httpClients = httpClients;
            _configuration = configuration;
        }

        [HttpGet("GetMessage")]
        public async Task<ActionResult<ChatModel>> GetMessage(int PageIndex = 0, int PageSize = 10)
        {
            if (PageIndex < 0 || PageSize is < 1 or > 100) return BadRequest();
            try
            {
                ApiResponse<ChatModel> response = await _chatRepository.GetMessage(PageIndex, PageSize);
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

        [Authorize(Policy = "chat.send")]
        [EnableRateLimiting("API")]
        [HttpPost("image")]
        [RequestSizeLimit(3 * 1024 * 1024)]
        [RequestFormLimits(MultipartBodyLengthLimit = 3 * 1024 * 1024)]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile file, CancellationToken cancellationToken)
        {
            if (file == null || file.Length == 0 || file.Length >= 2 * 1024 * 1024)
                return BadRequest(new ApiResponse<ChatImageDto>("Ảnh phải có dung lượng nhỏ hơn 2 MB."));
            var contentTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
            if (!contentTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase))
                return BadRequest(new ApiResponse<ChatImageDto>("Chỉ hỗ trợ ảnh JPG, PNG, GIF hoặc WebP."));
            if (!CloudinaryAccount.TryGetSettings(_configuration, out var cloudName, out var apiKey, out var apiSecret))
                return StatusCode(503, new ApiResponse<ChatImageDto>("Cloudinary chưa được cấu hình trên máy chủ."));

            const string formats = "jpg,jpeg,png,gif,webp";
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(System.Globalization.CultureInfo.InvariantCulture);
            var signature = CloudinaryAccount.Sign($"allowed_formats={formats}&timestamp={timestamp}", apiSecret);
            using var form = new MultipartFormDataContent();
            using var fileContent = new StreamContent(file.OpenReadStream());
            fileContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
            form.Add(fileContent, "file", Path.GetFileName(file.FileName));
            form.Add(new StringContent(apiKey), "api_key");
            form.Add(new StringContent(timestamp), "timestamp");
            form.Add(new StringContent(signature), "signature");
            form.Add(new StringContent(formats), "allowed_formats");
            using var client = _httpClients.CreateClient();
            try
            {
                using var response = await client.PostAsync($"https://api.cloudinary.com/v1_1/{Uri.EscapeDataString(cloudName)}/image/upload", form, cancellationToken);
                if (!response.IsSuccessStatusCode)
                    return StatusCode(502, new ApiResponse<ChatImageDto>("Không thể tải ảnh lên. Vui lòng thử lại."));
                using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
                if (!json.RootElement.TryGetProperty("secure_url", out var value)
                    || value.ValueKind != JsonValueKind.String
                    || !Uri.TryCreate(value.GetString(), UriKind.Absolute, out var url) || url.Scheme != Uri.UriSchemeHttps)
                    return StatusCode(502, new ApiResponse<ChatImageDto>("Không nhận được link ảnh hợp lệ."));
                return Ok(new ApiResponse<ChatImageDto>(new ChatImageDto { Url = value.GetString()! }));
            }
            catch (Exception ex) when (ex is HttpRequestException or JsonException || ex is TaskCanceledException && !cancellationToken.IsCancellationRequested)
            {
                return StatusCode(502, new ApiResponse<ChatImageDto>("Không thể tải ảnh lên. Vui lòng thử lại."));
            }
        }
    }
}
