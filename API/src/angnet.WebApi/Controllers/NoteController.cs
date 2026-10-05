using System.Security.Claims;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NoteController : ControllerBase
    {
        private readonly INoteService _noteService;

        public NoteController(INoteService noteService)
        {
            _noteService = noteService;
        }

        [AllowAnonymous]
        [EnableRateLimiting("API")]
        [HttpGet("Feed")]
        public async Task<IActionResult> Feed(int pageSize = 10, string cursor = "")
        {
            return Ok(await _noteService.GetPublicFeed(pageSize, cursor));
        }

        [AllowAnonymous]
        [EnableRateLimiting("NoteCreate")]
        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] NoteCreateDto request)
        {
            return Ok(await _noteService.Create(request));
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
