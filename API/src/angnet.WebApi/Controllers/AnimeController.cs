using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace angnet.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [EnableRateLimiting("API")]
    public class AnimeController : ControllerBase
    {
        private readonly IAnimeService _animeService;

        public AnimeController(IAnimeService animeService)
        {
            _animeService = animeService;
        }

        [HttpGet("Search")]
        [Authorize(Policy = "anime.view")]
        public async Task<IActionResult> Search(string keyword, int page = 1, int pageSize = 18)
        {
            return Ok(await _animeService.Search(keyword, page, pageSize));
        }

        [HttpGet("{aniListId:int}")]
        [Authorize(Policy = "anime.view")]
        public async Task<IActionResult> Detail(int aniListId)
        {
            return Ok(await _animeService.GetDetail(aniListId));
        }

        [HttpGet("{aniListId:int}/episodes/{episodeNumber:int}/playback")]
        [Authorize(Policy = "anime.view")]
        public async Task<IActionResult> Playback(int aniListId, int episodeNumber)
        {
            return Ok(await _animeService.GetPlayback(aniListId, episodeNumber));
        }

        [HttpGet("Admin/Catalog")]
        [Authorize(Policy = "anime.manage")]
        public async Task<IActionResult> AdminCatalog(string keyword = "")
        {
            return Ok(await _animeService.GetAdminCatalog(keyword));
        }

        [HttpPost("Admin/Import/{aniListId:int}")]
        [Authorize(Policy = "anime.manage")]
        public async Task<IActionResult> Import(int aniListId)
        {
            return Ok(await _animeService.Import(aniListId, CurrentUserId()));
        }

        [HttpGet("Admin/{aniListId:int}/Episodes")]
        [Authorize(Policy = "anime.manage")]
        public async Task<IActionResult> AdminEpisodes(int aniListId)
        {
            return Ok(await _animeService.GetAdminEpisodes(aniListId));
        }

        [HttpPost("Admin/Source")]
        [Authorize(Policy = "anime.manage")]
        public async Task<IActionResult> SaveSource([FromBody] AnimeSourceSaveDto request)
        {
            return Ok(await _animeService.SaveSource(request, CurrentUserId()));
        }

        [HttpPatch("Admin/Source/{sourceId}/Toggle")]
        [Authorize(Policy = "anime.manage")]
        public async Task<IActionResult> ToggleSource(string sourceId, bool flagActive)
        {
            return Ok(await _animeService.ToggleSource(sourceId, flagActive, CurrentUserId()));
        }

        [HttpDelete("Admin/Source/{sourceId}")]
        [Authorize(Policy = "anime.manage")]
        public async Task<IActionResult> DeleteSource(string sourceId)
        {
            return Ok(await _animeService.DeleteSource(sourceId));
        }

        private string CurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        }
    }
}
