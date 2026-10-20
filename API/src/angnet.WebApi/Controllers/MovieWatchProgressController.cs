using System.Security.Claims;
using System.Text.Json;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers;

[ApiController]
[Route("api/Movie/Progress")]
[Authorize(Policy = "movie.view")]
[EnableRateLimiting("API")]
public class MovieWatchProgressController(IMovieWatchProgressService progress, ILogger<MovieWatchProgressController> logger) : ControllerBase
{
    [HttpPut("{slug}")]
    public async Task<IActionResult> Save(string slug, MovieWatchProgressSaveDto data, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();
        try { return Ok(new ApiResponse<MovieWatchProgressDto>(await progress.Save(userId, slug, data, cancellationToken))); }
        catch (ArgumentException ex) { return BadRequest(new ApiResponse<MovieWatchProgressDto>(ex.Message)); }
        catch (KeyNotFoundException ex) { return NotFound(new ApiResponse<MovieWatchProgressDto>(ex.Message)); }
        catch (OperationCanceledException) when (HttpContext.RequestAborted.IsCancellationRequested) { return StatusCode(499); }
        catch (Exception ex) when (ex is HttpRequestException or OperationCanceledException or JsonException or InvalidOperationException)
        {
            logger.LogWarning(ex, "Movie progress request failed");
            return StatusCode(503, new ApiResponse<MovieWatchProgressDto>("Không thể lưu tiến trình xem lúc này."));
        }
    }
}
