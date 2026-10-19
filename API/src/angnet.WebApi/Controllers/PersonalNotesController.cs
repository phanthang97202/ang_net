using angnet.Domain.Dtos;
using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers;

[ApiController, Authorize(Policy = "personalnote.use"), Route("api/PersonalNotes"), EnableRateLimiting("API")]
public class PersonalNotesController(PersonalNoteService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(string? keyword = null, int pageSize = 20, string? cursor = null)
    {
        try { return Ok(await service.List(User, keyword, pageSize, cursor)); }
        catch (ArgumentException) { return BadRequest(new { Code = "InvalidRequest" }); }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var note = await service.Get(User, id);
        return note == null ? NotFound() : Ok(note);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Save(string id, [FromBody] PersonalNoteSaveDto data)
    {
        try
        {
            var note = await service.Save(User, id, data);
            return note == null ? NotFound() : Ok(note);
        }
        catch (ArgumentException) { return BadRequest(new { Code = "InvalidNote" }); }
        catch (PersonalNoteConflictException) { return Conflict(new { Code = "NoteChanged" }); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, int version)
    {
        try { return await service.Delete(User, id, version) ? NoContent() : NotFound(); }
        catch (ArgumentException) { return BadRequest(new { Code = "InvalidRequest" }); }
        catch (PersonalNoteConflictException) { return Conflict(new { Code = "NoteChanged" }); }
    }
}
