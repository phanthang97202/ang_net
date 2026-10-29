using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers;

[ApiController, AllowAnonymous, Route("api/PublicPersonalNotes"), EnableRateLimiting("API")]
public class PublicPersonalNotesController(PersonalNoteService service) : ControllerBase
{
    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public Task<IActionResult> GetWithHeader([FromHeader(Name = "X-Note-Token")] string? token) => Get(token ?? "");

    [HttpGet("{token}")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> Get(string token)
    {
        var note = await service.Public(token);
        return note == null ? NotFound() : Ok(note);
    }
}
