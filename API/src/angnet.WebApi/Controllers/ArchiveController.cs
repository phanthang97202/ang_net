using System.Security.Claims;
using angnet.Domain.Dtos;
using angnet.Domain.Enums;
using angnet.Infrastructure.Data.Services;
using angnet.WebApi.Cloudinary;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers
{
    /*
        Thư viện lưu trữ cá nhân.

        - Ghi (tạo/sửa/xoá/tải file): cần quyền "archive.use" do Admin cấp theo vai
          trò, VÀ phải là chủ sở hữu - phần sau do ArchiveService kiểm tra.
        - Đọc một bộ sưu tập: AllowAnonymous để link chia sẻ (Public/Unlisted) mở
          được khi chưa đăng nhập; bộ Private chỉ chủ sở hữu đọc được.

        File được trình duyệt tải thẳng lên Cloudinary bằng chữ ký server cấp
        (UploadSignature), không đi qua server - Render sleep sau 15 phút và video
        đi qua server sẽ tốn gấp đôi băng thông.
    */
    [Route("api/[controller]")]
    [ApiController]
    [EnableRateLimiting("API")]
    public class ArchiveController : ControllerBase
    {
        private const string UsePermission = "archive.use";

        // Giới hạn của gói Cloudinary miễn phí
        private const long MaxImageBytes = 10L * 1024 * 1024;
        private const long MaxVideoBytes = 100L * 1024 * 1024;
        private const string ImageFormats = "jpg,jpeg,png,webp,gif,heic,avif";
        private const string VideoFormats = "mp4,mov,webm,m4v";

        // Chế độ folder của tài khoản Cloudinary gần như không bao giờ đổi, không
        // cần hỏi Admin API mỗi lần cấp chữ ký
        private static bool? _usesDynamicFolders;

        private readonly IArchiveService _archiveService;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ArchiveController> _logger;

        public ArchiveController(
            IArchiveService archiveService,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            ILogger<ArchiveController> logger)
        {
            _archiveService = archiveService;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _logger = logger;
        }

        [Authorize(Policy = UsePermission)]
        [HttpGet("MyCollections")]
        public async Task<IActionResult> MyCollections()
        {
            return Ok(await _archiveService.GetMyCollectionsAsync(CurrentUserId()));
        }

        [AllowAnonymous]
        [HttpGet("Collection")]
        public async Task<IActionResult> Collection(string collectionId)
        {
            return Ok(await _archiveService.GetCollectionAsync(CurrentUserId(), collectionId));
        }

        [AllowAnonymous]
        [HttpGet("Items")]
        public async Task<IActionResult> Items(string collectionId, int pageIndex = 0, int pageSize = 24)
        {
            return Ok(await _archiveService.GetItemsAsync(CurrentUserId(), collectionId, pageIndex, pageSize));
        }

        [Authorize(Policy = UsePermission)]
        [HttpPost("Collection")]
        public async Task<IActionResult> CreateCollection([FromBody] ArchiveCollectionSaveDto request)
        {
            return Ok(await _archiveService.CreateCollectionAsync(CurrentUserId(), request));
        }

        [Authorize(Policy = UsePermission)]
        [HttpPut("Collection")]
        public async Task<IActionResult> UpdateCollection([FromBody] ArchiveCollectionSaveDto request)
        {
            return Ok(await _archiveService.UpdateCollectionAsync(CurrentUserId(), request));
        }

        [Authorize(Policy = UsePermission)]
        [HttpDelete("Collection")]
        public async Task<IActionResult> DeleteCollection(string collectionId)
        {
            var (response, files) = await _archiveService.DeleteCollectionAsync(CurrentUserId(), collectionId);
            await DestroyFiles(files);
            return Ok(response);
        }

        [Authorize(Policy = UsePermission)]
        [HttpPost("ReorderCollection")]
        public async Task<IActionResult> ReorderCollection([FromBody] ArchiveCollectionReorderDto request)
        {
            return Ok(await _archiveService.ReorderCollectionAsync(CurrentUserId(), request));
        }

        [Authorize(Policy = UsePermission)]
        [HttpPost("Item")]
        public async Task<IActionResult> CreateItem([FromBody] ArchiveItemCreateDto request)
        {
            CloudinaryAccount.TryGetSettings(_configuration, out string cloudName, out _, out _);
            return Ok(await _archiveService.CreateItemAsync(CurrentUserId(), request, cloudName));
        }

        [Authorize(Policy = UsePermission)]
        [HttpPut("Item")]
        public async Task<IActionResult> UpdateItem([FromBody] ArchiveItemUpdateDto request)
        {
            return Ok(await _archiveService.UpdateItemAsync(CurrentUserId(), request));
        }

        [Authorize(Policy = UsePermission)]
        [HttpDelete("Item")]
        public async Task<IActionResult> DeleteItem(string itemId)
        {
            var (response, files) = await _archiveService.DeleteItemAsync(CurrentUserId(), itemId);
            await DestroyFiles(files);
            return Ok(response);
        }

        /// <summary>
        /// Cấp chữ ký cho đúng MỘT lần tải file. public_id do server sinh trong thư
        /// mục archive/{userId}/ và nằm trong chữ ký, nên client không đổi được nơi
        /// lưu; allowed_formats cũng được ký nên không lách được định dạng.
        /// </summary>
        [Authorize(Policy = UsePermission)]
        [HttpGet("UploadSignature")]
        public async Task<IActionResult> UploadSignature(EArchiveItemKind kind)
        {
            if (kind != EArchiveItemKind.Image && kind != EArchiveItemKind.Video)
            {
                return Ok(new ApiResponse<ArchiveUploadSignatureDto>("Chỉ tải lên được ảnh hoặc video"));
            }

            if (!CloudinaryAccount.TryGetSettings(_configuration, out string cloudName, out string apiKey, out string apiSecret))
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable,
                    new ApiResponse<ArchiveUploadSignatureDto>("Cloudinary chưa được cấu hình trên máy chủ"));
            }

            string userFolder = ArchiveService.StorageFolderFor(CurrentUserId());
            string publicId = $"{userFolder}/{Guid.NewGuid():N}";
            string allowedFormats = kind == EArchiveItemKind.Image ? ImageFormats : VideoFormats;
            string resourceType = kind == EArchiveItemKind.Image ? "image" : "video";

            // Dynamic folder: public_id có '/' không tự xếp file vào thư mục trên
            // Media Library, phải nói rõ asset_folder. Fixed folder thì public_id
            // chính là đường dẫn, gửi asset_folder sẽ bị từ chối.
            if (_usesDynamicFolders is null)
            {
                using HttpClient adminClient = CloudinaryAccount.CreateAdminClient(_httpClientFactory, apiKey, apiSecret);
                _usesDynamicFolders = await CloudinaryAccount.UsesDynamicFolders(adminClient, cloudName);
            }
            string assetFolder = _usesDynamicFolders == true ? userFolder : string.Empty;

            long timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            // Tham số ký phải xếp theo alphabet
            List<string> signed = new List<string> { $"allowed_formats={allowedFormats}" };
            if (assetFolder != string.Empty)
            {
                signed.Add($"asset_folder={assetFolder}");
            }
            signed.Add($"public_id={publicId}");
            // Token xoá (hiệu lực 10 phút) để client tự dọn file nếu lưu mục thất bại
            signed.Add("return_delete_token=true");
            signed.Add($"timestamp={timestamp}");

            return Ok(new ApiResponse<ArchiveUploadSignatureDto>(new ArchiveUploadSignatureDto
            {
                UploadUrl = $"https://api.cloudinary.com/v1_1/{Uri.EscapeDataString(cloudName)}/{resourceType}/upload",
                ApiKey = apiKey,
                Timestamp = timestamp,
                Signature = CloudinaryAccount.Sign(string.Join("&", signed), apiSecret),
                PublicId = publicId,
                AssetFolder = assetFolder,
                AllowedFormats = allowedFormats,
                MaxBytes = kind == EArchiveItemKind.Image ? MaxImageBytes : MaxVideoBytes,
            }));
        }

        private string CurrentUserId()
        {
            return User?.Identity?.IsAuthenticated == true
                ? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty
                : string.Empty;
        }

        /// <summary>
        /// Xoá file trên Cloudinary sau khi bản ghi đã xoá khỏi DB. Lỗi ở đây chỉ
        /// ghi log: người dùng đã xoá xong theo đúng nghĩa của họ, file sót lại
        /// chỉ tốn dung lượng chứ không còn ai truy cập qua ứng dụng.
        /// </summary>
        private async Task DestroyFiles(List<ArchiveStoredFileDto> files)
        {
            if (files.Count == 0 ||
                !CloudinaryAccount.TryGetSettings(_configuration, out string cloudName, out string apiKey, out string apiSecret))
            {
                return;
            }

            using HttpClient client = CloudinaryAccount.CreateAdminClient(_httpClientFactory, apiKey, apiSecret);

            // Admin API xoá tối đa 100 public_id mỗi lần, theo từng resource type
            var batches = files
                .Where(f => f.PublicId.StartsWith(ArchiveService.StorageRootFolder + "/", StringComparison.Ordinal))
                .GroupBy(f => f.Kind == EArchiveItemKind.Video ? "video" : "image")
                .SelectMany(group => group.Chunk(100).Select(chunk => (ResourceType: group.Key, Files: chunk)));

            foreach (var (resourceType, chunk) in batches)
            {
                string query = string.Join("&", chunk.Select(f => $"public_ids[]={Uri.EscapeDataString(f.PublicId)}"));
                try
                {
                    using HttpResponseMessage response = await client.DeleteAsync(
                        $"https://api.cloudinary.com/v1_1/{Uri.EscapeDataString(cloudName)}/resources/{resourceType}/upload?invalidate=true&{query}");
                    if (!response.IsSuccessStatusCode)
                    {
                        _logger.LogWarning("Archive: xoa {Count} file {Type} tren Cloudinary that bai: {Status} {Body}",
                            chunk.Length, resourceType, (int)response.StatusCode, await response.Content.ReadAsStringAsync());
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Archive: khong goi duoc Cloudinary de xoa {Count} file {Type}",
                        chunk.Length, resourceType);
                }
            }
        }
    }
}
