using angnet.Domain.Dtos;
using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers;

[ApiController, Authorize, Route("api/Me"), EnableRateLimiting("API")]
public class MyBlogController(MyBlogService service) : ControllerBase
{
    [HttpGet("Favorites")]
    public async Task<IActionResult> Favorites(int pageSize = 12, string? cursor = null)
    {
        try { return Ok(new ApiResponse<RPNewsDto> { objResult = await service.Favorites(User, pageSize, cursor) }); }
        catch (ArgumentException) { return BadRequest(); }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
    }

    [HttpGet("Activity")]
    public async Task<IActionResult> Activity(int pageSize = 20, string? cursor = null)
    {
        try { return Ok(new ApiResponse<BlogActivityDto> { objResult = await service.Activity(User, pageSize, cursor) }); }
        catch (ArgumentException) { return BadRequest(); }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
    }
}
