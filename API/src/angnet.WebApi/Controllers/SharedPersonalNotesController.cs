using angnet.Domain.Dtos;
using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers;

// The unguessable edit token is a capability explicitly granted by the owner.
// It grants editing of this original note only, never ownership or sharing controls.
[ApiController, AllowAnonymous, Route("api/SharedPersonalNotes"), EnableRateLimiting("API")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public class SharedPersonalNotesController(PersonalNoteService service) : ControllerBase
{
    [HttpGet]
    public Task<IActionResult> GetWithHeader([FromHeader(Name = "X-Note-Token")] string? token) => Get(token ?? "");

    [HttpPut, RequestSizeLimit(16 * 1024 * 1024)]
    public Task<IActionResult> SaveWithHeader([FromHeader(Name = "X-Note-Token")] string? token, [FromBody] PersonalNoteSaveDto data) => Save(token ?? "", data);

    [HttpGet("{token}")]
    public async Task<IActionResult> Get(string token)
    {
        var note = await service.Shared(token);
        return note == null ? NotFound() : Ok(note);
    }

    [HttpPut("{token}"), RequestSizeLimit(16 * 1024 * 1024)]
    public async Task<IActionResult> Save(string token, [FromBody] PersonalNoteSaveDto data)
    {
        try {
            var note = await service.SaveShared(token, data);
            return note == null ? NotFound() : Ok(note);
        }
        catch (ArgumentException) { return BadRequest(new { Code = "InvalidNote" }); }
        catch (PersonalNoteConflictException) { return Conflict(new { Code = "NoteChanged" }); }
    }
}
