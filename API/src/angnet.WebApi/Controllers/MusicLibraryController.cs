using System.Security.Claims;
using angnet.Domain.Dtos;
using angnet.Domain.Enums;
using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers
{
    /*
        Thư viện nhạc: nút Lưu + bộ sưu tập nhạc.

        - Ghi và các danh sách "của tôi": cần quyền "music.use" (cùng quyền mở module
          âm nhạc), VÀ phải là chủ sở hữu - phần sau do MusicLibraryService kiểm tra.
        - Đọc một bộ sưu tập: AllowAnonymous để link chia sẻ (Public/Unlisted) mở
          được khi chưa đăng nhập; bộ Private chỉ chủ sở hữu đọc được.
    */
    [Route("api/[controller]")]
    [ApiController]
    [EnableRateLimiting("API")]
    public class MusicLibraryController : ControllerBase
    {
        private const string UsePermission = "music.use";

        private readonly IMusicLibraryService _musicLibraryService;

        public MusicLibraryController(IMusicLibraryService musicLibraryService)
        {
            _musicLibraryService = musicLibraryService;
        }

        [Authorize(Policy = UsePermission)]
        [HttpGet("Saved")]
        public async Task<IActionResult> Saved(int pageIndex = 0, int pageSize = 50)
        {
            return Ok(await _musicLibraryService.GetSavedAsync(CurrentUserId(), pageIndex, pageSize));
        }

        /// <summary>Bài nào trong danh sách (vd. kết quả tìm kiếm) đã được lưu - một request cho cả trang.</summary>
        [Authorize(Policy = UsePermission)]
        [HttpPost("SaveState")]
        public async Task<IActionResult> SaveState([FromBody] MusicSaveStateRequestDto request)
        {
            return Ok(await _musicLibraryService.GetSaveStateAsync(CurrentUserId(), request));
        }

        [Authorize(Policy = UsePermission)]
        [HttpPost("Save")]
        public async Task<IActionResult> Save([FromBody] MusicTrackKeyDto request, CancellationToken cancellationToken)
        {
            return Ok(await _musicLibraryService.SaveAsync(CurrentUserId(), request, cancellationToken));
        }

        [Authorize(Policy = UsePermission)]
        [HttpDelete("Save")]
        public async Task<IActionResult> Unsave(string trackId)
        {
            return Ok(await _musicLibraryService.UnsaveAsync(CurrentUserId(), trackId));
        }

        [Authorize(Policy = UsePermission)]
        [HttpGet("MyCollections")]
        public async Task<IActionResult> MyCollections(EMusicProvider? provider = null, string externalId = "")
        {
            return Ok(await _musicLibraryService.GetMyCollectionsAsync(CurrentUserId(), provider, externalId));
        }

        [AllowAnonymous]
        [HttpGet("Collection")]
        public async Task<IActionResult> Collection(string collectionId)
        {
            return Ok(await _musicLibraryService.GetCollectionAsync(CurrentUserId(), collectionId));
        }

        [AllowAnonymous]
        [HttpGet("CollectionTracks")]
        public async Task<IActionResult> CollectionTracks(string collectionId, int pageIndex = 0, int pageSize = 50)
        {
            return Ok(await _musicLibraryService.GetCollectionTracksAsync(CurrentUserId(), collectionId, pageIndex, pageSize));
        }

        [Authorize(Policy = UsePermission)]
        [HttpPost("Collection")]
        public async Task<IActionResult> CreateCollection([FromBody] MusicCollectionSaveDto request)
        {
            return Ok(await _musicLibraryService.CreateCollectionAsync(CurrentUserId(), request));
        }

        [Authorize(Policy = UsePermission)]
        [HttpPut("Collection")]
        public async Task<IActionResult> UpdateCollection([FromBody] MusicCollectionSaveDto request)
        {
            return Ok(await _musicLibraryService.UpdateCollectionAsync(CurrentUserId(), request));
        }

        [Authorize(Policy = UsePermission)]
        [HttpDelete("Collection")]
        public async Task<IActionResult> DeleteCollection(string collectionId)
        {
            return Ok(await _musicLibraryService.DeleteCollectionAsync(CurrentUserId(), collectionId));
        }

        [Authorize(Policy = UsePermission)]
        [HttpPost("CollectionItem")]
        public async Task<IActionResult> AddToCollection([FromBody] MusicCollectionItemAddDto request, CancellationToken cancellationToken)
        {
            return Ok(await _musicLibraryService.AddToCollectionAsync(CurrentUserId(), request, cancellationToken));
        }

        [Authorize(Policy = UsePermission)]
        [HttpDelete("CollectionItem")]
        public async Task<IActionResult> RemoveFromCollection(string collectionId, string trackId)
        {
            return Ok(await _musicLibraryService.RemoveFromCollectionAsync(CurrentUserId(), collectionId, trackId));
        }

        [Authorize(Policy = UsePermission)]
        [HttpPost("MoveCollectionItem")]
        public async Task<IActionResult> MoveCollectionItem([FromBody] MusicCollectionItemMoveDto request)
        {
            return Ok(await _musicLibraryService.MoveCollectionItemAsync(CurrentUserId(), request));
        }

        private string CurrentUserId()
        {
            return User?.Identity?.IsAuthenticated == true
                ? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty
                : string.Empty;
        }
    }
}
