using angnet.Domain.Dtos;
using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers;

[ApiController, Authorize, Route("api/Notifications"), EnableRateLimiting("API")]
public class NotificationsController(BlogNotificationService service) : ControllerBase
{
    public record ReadAllRequest(DateTime Through);

    [HttpGet]
    public async Task<IActionResult> List(int pageSize = 15, string? cursor = null)
    {
        try { return Ok(new ApiResponse<BlogNotificationDto> { objResult = await service.List(User, pageSize, cursor) }); }
        catch (ArgumentException) { return BadRequest(); }
    }

    [HttpGet("Unread")]
    public async Task<IActionResult> Unread() => Ok(new { UnreadCount = await service.Unread(User) });

    [HttpPost("{id}/Read")]
    public async Task<IActionResult> Read(string id) => Ok(new { UnreadCount = await service.Read(User, id, null) });

    [HttpPost("ReadAll")]
    public async Task<IActionResult> ReadAll([FromBody] ReadAllRequest request)
    {
        try { return Ok(new { UnreadCount = await service.Read(User, null, request.Through) }); }
        catch (ArgumentException) { return BadRequest(); }
    }
}
