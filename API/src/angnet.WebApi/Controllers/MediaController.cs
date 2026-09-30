using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using angnet.Domain.Dtos;
using angnet.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace angnet.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [EnableRateLimiting("API")]
    public class MediaController : ControllerBase
    {
        private static readonly HashSet<string> AllowedResourceTypes =
            new(StringComparer.OrdinalIgnoreCase) { "image", "video", "raw" };

        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _dbContext;

        public MediaController(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            AppDbContext dbContext)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _dbContext = dbContext;
        }

        [Authorize(Policy = "media.view")]
        [HttpGet("Search")]
        public async Task<ActionResult<ApiResponse<MediaPageDto>>> Search(
            string resourceType = "image",
            int pageSize = 24,
            string nextCursor = "",
            string prefix = "",
            string folder = "")
        {
            if (!AllowedResourceTypes.Contains(resourceType))
            {
                return BadRequest(new ApiResponse<MediaPageDto>("Loại file không hợp lệ"));
            }

            if (!TryGetCloudinarySettings(out string cloudName, out string apiKey, out string apiSecret))
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable,
                    new ApiResponse<MediaPageDto>("Cloudinary chưa được cấu hình trên máy chủ"));
            }

            pageSize = Math.Clamp(pageSize, 1, 100);
            var expression = new List<string> { $"resource_type:{resourceType}" };
            if (!string.IsNullOrWhiteSpace(folder))
            {
                expression.Add($"asset_folder=\"{EscapeSearchPhrase(NormalizeFolderPath(folder))}\"");
            }
            if (!string.IsNullOrWhiteSpace(prefix))
            {
                expression.Add($"public_id:{EscapeSearchToken(prefix.Trim())}*");
            }

            var searchBody = new Dictionary<string, object>
            {
                ["expression"] = string.Join(" AND ", expression),
                ["max_results"] = pageSize,
                ["sort_by"] = new[] { new Dictionary<string, string> { ["created_at"] = "desc" } }
            };
            if (!string.IsNullOrWhiteSpace(nextCursor))
            {
                searchBody["next_cursor"] = nextCursor;
            }

            using HttpClient client = CreateCloudinaryClient(apiKey, apiSecret);
            using HttpResponseMessage response = await client.PostAsJsonAsync(
                $"https://api.cloudinary.com/v1_1/{Uri.EscapeDataString(cloudName)}/resources/search",
                searchBody);
            string json = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode,
                    new ApiResponse<MediaPageDto>(ReadCloudinaryError(json)));
            }

            using JsonDocument document = JsonDocument.Parse(json);
            JsonElement root = document.RootElement;
            var page = new MediaPageDto
            {
                NextCursor = GetString(root, "next_cursor")
            };

            if (root.TryGetProperty("resources", out JsonElement resources))
            {
                page.Assets = resources.EnumerateArray().Select(MapAsset).ToList();
            }

            return Ok(new ApiResponse<MediaPageDto>(page));
        }

        [Authorize(Policy = "media.view")]
        [HttpGet("Folders")]
        public async Task<ActionResult<ApiResponse<MediaFolderDto>>> Folders()
        {
            if (!TryGetCloudinarySettings(out string cloudName, out string apiKey, out string apiSecret))
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable,
                    new ApiResponse<MediaFolderDto>("Cloudinary chưa được cấu hình trên máy chủ"));
            }

            using HttpClient client = CreateCloudinaryClient(apiKey, apiSecret);
            using HttpResponseMessage response = await client.GetAsync(
                $"https://api.cloudinary.com/v1_1/{Uri.EscapeDataString(cloudName)}/folders/search?max_results=500");
            string json = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode,
                    new ApiResponse<MediaFolderDto>(ReadCloudinaryError(json)));
            }

            using JsonDocument document = JsonDocument.Parse(json);
            var folders = new List<MediaFolderDto>();
            if (document.RootElement.TryGetProperty("folders", out JsonElement items))
            {
                folders = items.EnumerateArray()
                    .Select(item => new MediaFolderDto
                    {
                        ExternalId = GetString(item, "external_id"),
                        Name = GetString(item, "name"),
                        Path = GetString(item, "path")
                    })
                    .Where(item => !string.IsNullOrWhiteSpace(item.Path))
                    .OrderBy(item => item.Path, StringComparer.OrdinalIgnoreCase)
                    .ToList();
            }

            return Ok(new ApiResponse<MediaFolderDto> { DataList = folders });
        }

        [Authorize(Policy = "media.upload")]
        [HttpPost("Folder")]
        public async Task<ActionResult<ApiResponse<MediaFolderDto>>> CreateFolder(
            [FromBody] MediaFolderRequestDto request)
        {
            string path = NormalizeFolderPath(request.Path);
            if (!IsValidFolderPath(path))
            {
                return BadRequest(new ApiResponse<MediaFolderDto>("Tên thư mục không hợp lệ"));
            }
            if (!TryGetCloudinarySettings(out string cloudName, out string apiKey, out string apiSecret))
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable,
                    new ApiResponse<MediaFolderDto>("Cloudinary chưa được cấu hình trên máy chủ"));
            }

            using HttpClient client = CreateCloudinaryClient(apiKey, apiSecret);
            using HttpResponseMessage response = await client.PostAsync(
                $"https://api.cloudinary.com/v1_1/{Uri.EscapeDataString(cloudName)}/folders/{EncodePath(path)}",
                new StringContent(string.Empty));
            string json = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode,
                    new ApiResponse<MediaFolderDto>(ReadCloudinaryError(json)));
            }

            using JsonDocument document = JsonDocument.Parse(json);
            JsonElement root = document.RootElement;
            return Ok(new ApiResponse<MediaFolderDto>(new MediaFolderDto
            {
                ExternalId = GetString(root, "external_id"),
                Name = GetString(root, "name", path.Split('/').Last()),
                Path = GetString(root, "path", path)
            }));
        }

        [Authorize(Policy = "media.delete")]
        [HttpDelete("Folder")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteFolder(string path)
        {
            path = NormalizeFolderPath(path);
            if (!IsValidFolderPath(path))
            {
                return BadRequest(new ApiResponse<bool>("Tên thư mục không hợp lệ"));
            }
            if (!TryGetCloudinarySettings(out string cloudName, out string apiKey, out string apiSecret))
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable,
                    new ApiResponse<bool>("Cloudinary chưa được cấu hình trên máy chủ"));
            }

            using HttpClient client = CreateCloudinaryClient(apiKey, apiSecret);
            using var request = new HttpRequestMessage(
                HttpMethod.Delete,
                $"https://api.cloudinary.com/v1_1/{Uri.EscapeDataString(cloudName)}/folders/{EncodePath(path)}");
            using HttpResponseMessage response = await client.SendAsync(request);
            string json = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode,
                    new ApiResponse<bool>(ReadCloudinaryError(json)));
            }

            return Ok(new ApiResponse<bool>(true));
        }

        [Authorize(Policy = "media.upload")]
        [HttpPost("Upload")]
        [RequestSizeLimit(52_428_800)]
        public async Task<ActionResult<ApiResponse<MediaAssetDto>>> Upload(
            IFormFile file,
            [FromForm] string folder = "")
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new ApiResponse<MediaAssetDto>("Vui lòng chọn file cần tải lên"));
            }
            if (file.Length > 50 * 1024 * 1024)
            {
                return BadRequest(new ApiResponse<MediaAssetDto>("Dung lượng file tối đa là 50 MB"));
            }
            if (!TryGetCloudinarySettings(out string cloudName, out string apiKey, out string apiSecret))
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable,
                    new ApiResponse<MediaAssetDto>("Cloudinary chưa được cấu hình trên máy chủ"));
            }

            folder = NormalizeFolderPath(folder);
            if (!string.IsNullOrWhiteSpace(folder) && !IsValidFolderPath(folder))
            {
                return BadRequest(new ApiResponse<MediaAssetDto>("Tên thư mục không hợp lệ"));
            }

            long timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            string parameters = string.IsNullOrWhiteSpace(folder)
                ? $"timestamp={timestamp}"
                : $"asset_folder={folder}&timestamp={timestamp}";
            string signature = SignCloudinaryParameters(parameters, apiSecret);
            using var form = new MultipartFormDataContent();
            using var fileContent = new StreamContent(file.OpenReadStream());
            if (!string.IsNullOrWhiteSpace(file.ContentType))
            {
                fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse(file.ContentType);
            }
            form.Add(fileContent, "file", file.FileName);
            form.Add(new StringContent(apiKey), "api_key");
            form.Add(new StringContent(timestamp.ToString()), "timestamp");
            form.Add(new StringContent(signature), "signature");
            if (!string.IsNullOrWhiteSpace(folder))
            {
                form.Add(new StringContent(folder), "asset_folder");
            }

            using HttpClient client = _httpClientFactory.CreateClient();
            using HttpResponseMessage response = await client.PostAsync(
                $"https://api.cloudinary.com/v1_1/{Uri.EscapeDataString(cloudName)}/auto/upload", form);
            string json = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode,
                    new ApiResponse<MediaAssetDto>(ReadCloudinaryError(json)));
            }

            using JsonDocument document = JsonDocument.Parse(json);
            return Ok(new ApiResponse<MediaAssetDto>(MapAsset(document.RootElement)));
        }

        [Authorize(Policy = "media.delete")]
        [HttpDelete("Delete")]
        public async Task<ActionResult<ApiResponse<MediaDeleteResultDto>>> Delete(
            [FromBody] MediaDeleteRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.PublicId) ||
                string.IsNullOrWhiteSpace(request.SecureUrl) ||
                !AllowedResourceTypes.Contains(request.ResourceType))
            {
                return BadRequest(new ApiResponse<MediaDeleteResultDto>("Thông tin file không hợp lệ"));
            }

            List<MediaUsageDto> usages = await FindUsages(request.SecureUrl);
            if (usages.Count > 0)
            {
                return Conflict(new ApiResponse<MediaDeleteResultDto>("File đang được sử dụng, không thể xóa")
                {
                    Data = new MediaDeleteResultDto { Deleted = false, Usages = usages }
                });
            }

            if (!TryGetCloudinarySettings(out string cloudName, out string apiKey, out string apiSecret))
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable,
                    new ApiResponse<MediaDeleteResultDto>("Cloudinary chưa được cấu hình trên máy chủ"));
            }

            long timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            string parameters = $"invalidate=true&public_id={request.PublicId}&timestamp={timestamp}";
            string signature = SignCloudinaryParameters(parameters, apiSecret);
            using var form = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["public_id"] = request.PublicId,
                ["timestamp"] = timestamp.ToString(),
                ["api_key"] = apiKey,
                ["signature"] = signature,
                ["invalidate"] = "true"
            });

            using HttpClient client = _httpClientFactory.CreateClient();
            using HttpResponseMessage response = await client.PostAsync(
                $"https://api.cloudinary.com/v1_1/{Uri.EscapeDataString(cloudName)}/{request.ResourceType}/destroy", form);
            string json = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode,
                    new ApiResponse<MediaDeleteResultDto>(ReadCloudinaryError(json)));
            }

            using JsonDocument document = JsonDocument.Parse(json);
            string result = GetString(document.RootElement, "result");
            bool deleted = result is "ok" or "not found";
            return Ok(new ApiResponse<MediaDeleteResultDto>(new MediaDeleteResultDto
            {
                Deleted = deleted
            }));
        }

        private async Task<List<MediaUsageDto>> FindUsages(string url)
        {
            var usages = new List<MediaUsageDto>();

            usages.AddRange(await _dbContext.News.AsNoTracking()
                .Where(x => x.Thumbnail == url || x.ContentBody.Contains(url) || x.ContentBodyEn.Contains(url))
                .Select(x => new MediaUsageDto { Source = "Bài viết", Id = x.NewsId, Title = x.ShortTitle })
                .Take(10).ToListAsync());
            usages.AddRange(await _dbContext.RefFileNews.AsNoTracking()
                .Where(x => x.FileUrl == url)
                .Select(x => new MediaUsageDto { Source = "File bài viết", Id = x.RefFileNewsId, Title = x.NewsId })
                .Take(10).ToListAsync());
            usages.AddRange(await _dbContext.NewsCategory.AsNoTracking()
                .Where(x => x.NewsCategoryLogo == url)
                .Select(x => new MediaUsageDto { Source = "Danh mục", Id = x.NewsCategoryId, Title = x.NewsCategoryName })
                .Take(10).ToListAsync());
            usages.AddRange(await _dbContext.Reel.AsNoTracking()
                .Where(x => x.CoverUrl == url)
                .Select(x => new MediaUsageDto { Source = "Ảnh bìa reel", Id = x.ReelId, Title = x.Caption })
                .Take(10).ToListAsync());
            usages.AddRange(await _dbContext.ReelMedia.AsNoTracking()
                .Where(x => x.MediaUrl == url)
                .Select(x => new MediaUsageDto { Source = "Media reel", Id = x.ReelMediaId, Title = x.ReelId })
                .Take(10).ToListAsync());
            usages.AddRange(await _dbContext.NewsCommentMedia.AsNoTracking()
                .Where(x => x.Url == url)
                .Select(x => new MediaUsageDto { Source = "Bình luận", Id = x.MediaId, Title = x.CommentId })
                .Take(10).ToListAsync());
            usages.AddRange(await _dbContext.Chat.AsNoTracking()
                .Where(x => x.Message == url)
                .Select(x => new MediaUsageDto { Source = "Tin nhắn", Id = x.MessageId, Title = x.MessageId })
                .Take(10).ToListAsync());
            usages.AddRange(await _dbContext.Users.AsNoTracking()
                .Where(x => x.Avatar == url)
                .Select(x => new MediaUsageDto { Source = "Ảnh đại diện", Id = x.Id, Title = x.FullName })
                .Take(10).ToListAsync());
            usages.AddRange(await _dbContext.Tenant.AsNoTracking()
                .Where(x => x.TenantLogo == url)
                .Select(x => new MediaUsageDto { Source = "Tenant", Id = x.TenantId.ToString(), Title = x.TenantName })
                .Take(10).ToListAsync());

            return usages.Take(20).ToList();
        }

        private bool TryGetCloudinarySettings(out string cloudName, out string apiKey, out string apiSecret)
        {
            cloudName = _configuration["Cloudinary:CloudName"] ?? string.Empty;
            apiKey = _configuration["Cloudinary:ApiKey"] ?? string.Empty;
            apiSecret = _configuration["Cloudinary:ApiSecret"] ?? string.Empty;

            // Cloudinary/Render thường cung cấp một biến duy nhất dạng
            // cloudinary://api_key:api_secret@cloud_name. Vẫn ưu tiên ba biến tách
            // riêng ở trên để dễ cấu hình trên máy phát triển.
            string cloudinaryUrl = _configuration["CLOUDINARY_URL"] ?? string.Empty;
            if ((string.IsNullOrWhiteSpace(cloudName) ||
                 string.IsNullOrWhiteSpace(apiKey) ||
                 string.IsNullOrWhiteSpace(apiSecret)) &&
                Uri.TryCreate(cloudinaryUrl, UriKind.Absolute, out Uri? uri) &&
                uri.Scheme.Equals("cloudinary", StringComparison.OrdinalIgnoreCase))
            {
                string[] credentials = uri.UserInfo.Split(':', 2);
                if (credentials.Length == 2)
                {
                    apiKey = Uri.UnescapeDataString(credentials[0]);
                    apiSecret = Uri.UnescapeDataString(credentials[1]);
                    cloudName = uri.Host;
                }
            }

            return !string.IsNullOrWhiteSpace(cloudName) &&
                   !string.IsNullOrWhiteSpace(apiKey) &&
                   !string.IsNullOrWhiteSpace(apiSecret);
        }

        private HttpClient CreateCloudinaryClient(string apiKey, string apiSecret)
        {
            HttpClient client = _httpClientFactory.CreateClient();
            string credential = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{apiKey}:{apiSecret}"));
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credential);
            return client;
        }

        private static string SignCloudinaryParameters(string parameters, string apiSecret)
        {
            byte[] hash = SHA1.HashData(Encoding.UTF8.GetBytes(parameters + apiSecret));
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        private static string NormalizeFolderPath(string path) =>
            string.Join('/', (path ?? string.Empty).Split(
                '/',
                StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));

        private static bool IsValidFolderPath(string path) =>
            !string.IsNullOrWhiteSpace(path) &&
            path.Length <= 200 &&
            !path.Split('/').Any(segment =>
                string.IsNullOrWhiteSpace(segment) || segment is "." or ".." ||
                segment.IndexOfAny(['?', '#', '\\', '%', '<', '>']) >= 0);

        private static string EncodePath(string path) =>
            string.Join('/', path.Split('/').Select(Uri.EscapeDataString));

        private static string EscapeSearchPhrase(string value) =>
            value.Replace("\\", "\\\\").Replace("\"", "\\\"");

        private static string EscapeSearchToken(string value)
        {
            const string specialCharacters = " +-=&|><!(){}[]^\"~?:\\/";
            var result = new StringBuilder();
            foreach (char character in value)
            {
                if (specialCharacters.Contains(character)) result.Append('\\');
                result.Append(character);
            }
            return result.ToString();
        }

        private static MediaAssetDto MapAsset(JsonElement item)
        {
            return new MediaAssetDto
            {
                AssetId = GetString(item, "asset_id"),
                PublicId = GetString(item, "public_id"),
                DisplayName = GetString(item, "display_name"),
                SecureUrl = GetString(item, "secure_url"),
                ResourceType = GetString(item, "resource_type"),
                Format = GetString(item, "format"),
                Folder = GetString(item, "asset_folder", GetString(item, "folder")),
                Bytes = GetLong(item, "bytes"),
                Width = GetInt(item, "width"),
                Height = GetInt(item, "height"),
                Duration = GetNullableDouble(item, "duration"),
                CreatedAt = GetNullableDate(item, "created_at")
            };
        }

        private static string ReadCloudinaryError(string json)
        {
            try
            {
                using JsonDocument document = JsonDocument.Parse(json);
                if (document.RootElement.TryGetProperty("error", out JsonElement error))
                {
                    return GetString(error, "message", "Cloudinary trả về lỗi");
                }
            }
            catch (JsonException)
            {
                // Phản hồi không phải JSON: không trả nguyên nội dung để tránh lộ thông tin nội bộ.
            }
            return "Không thể kết nối tới Cloudinary";
        }

        private static string GetString(JsonElement item, string name, string fallback = "") =>
            item.TryGetProperty(name, out JsonElement value) && value.ValueKind == JsonValueKind.String
                ? value.GetString() ?? fallback
                : fallback;

        private static int GetInt(JsonElement item, string name) =>
            item.TryGetProperty(name, out JsonElement value) && value.TryGetInt32(out int result) ? result : 0;

        private static long GetLong(JsonElement item, string name) =>
            item.TryGetProperty(name, out JsonElement value) && value.TryGetInt64(out long result) ? result : 0;

        private static double? GetNullableDouble(JsonElement item, string name) =>
            item.TryGetProperty(name, out JsonElement value) && value.TryGetDouble(out double result) ? result : null;

        private static DateTime? GetNullableDate(JsonElement item, string name) =>
            item.TryGetProperty(name, out JsonElement value) && value.ValueKind == JsonValueKind.String &&
            DateTime.TryParse(value.GetString(), out DateTime result) ? result : null;
    }
}
