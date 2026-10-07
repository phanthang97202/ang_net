using angnet.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = "anime.view")]
    [EnableRateLimiting("API")]
    public class AnimeController : ControllerBase
    {
        private readonly IAnimeService _animeService;

        public AnimeController(IAnimeService animeService)
        {
            _animeService = animeService;
        }

        [HttpGet("Search")]
        public async Task<IActionResult> Search(string keyword, int page = 1, int pageSize = 18)
        {
            return Ok(await _animeService.Search(keyword, page, pageSize));
        }

        [HttpGet("{aniListId:int}")]
        public async Task<IActionResult> Detail(int aniListId)
        {
            return Ok(await _animeService.GetDetail(aniListId));
        }

        [HttpGet("{aniListId:int}/episodes/{episodeNumber:int}/playback")]
        public async Task<IActionResult> Playback(int aniListId, int episodeNumber)
        {
            return Ok(await _animeService.GetPlayback(aniListId, episodeNumber));
        }
    }
}
