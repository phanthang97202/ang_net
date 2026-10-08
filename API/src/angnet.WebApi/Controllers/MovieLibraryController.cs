using System.Text.Json;
using System.Security.Claims;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers;

[ApiController]
[Route("api/Movie/Library")]
[Route("api/Anime/Library")] // Compatibility for already-open clients; same permission gate.
[Authorize(Policy = "movie.view")]
[EnableRateLimiting("API")]
public class MovieLibraryController(IMovieLibraryService library, IMovieWishlistService wishlist, ILogger<MovieLibraryController> logger) : ControllerBase
{
    [HttpGet]
    public Task<IActionResult> Browse(string keyword = "", int page = 1, CancellationToken cancellationToken = default) =>
        Respond(async () =>
        {
            var result = await library.Browse(keyword, page, cancellationToken);
            await wishlist.MarkSaved(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "", result.Items, cancellationToken);
            return result;
        });

    [HttpGet("{slug}")]
    public Task<IActionResult> Detail(string slug, CancellationToken cancellationToken) =>
        Respond(async () =>
        {
            var result = await library.Detail(slug, cancellationToken);
            await wishlist.MarkSaved(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "", [result], cancellationToken);
            return result;
        });

    [HttpGet("{slug}/playback")]
    public Task<IActionResult> Playback(string slug, int server, string episode, CancellationToken cancellationToken) =>
        Respond(() => library.Playback(slug, server, episode, cancellationToken));

    private async Task<IActionResult> Respond<T>(Func<Task<T>> request)
    {
        if (string.IsNullOrWhiteSpace(User.FindFirstValue(ClaimTypes.NameIdentifier))) return Unauthorized();
        try { return Ok(new ApiResponse<T>(await request())); }
        catch (ArgumentException ex) { return BadRequest(new ApiResponse<T>(ex.Message)); }
        catch (KeyNotFoundException ex) { return NotFound(new ApiResponse<T>(ex.Message)); }
        catch (OperationCanceledException) when (HttpContext.RequestAborted.IsCancellationRequested) { return StatusCode(499); }
        catch (Exception ex) when (ex is HttpRequestException or OperationCanceledException or JsonException or InvalidOperationException)
        {
            logger.LogWarning(ex, "Movie provider request failed");
            return StatusCode(503, new ApiResponse<T>("Nguồn phim đang bận hoặc tạm thời không khả dụng. Vui lòng thử lại."));
        }
    }
}
