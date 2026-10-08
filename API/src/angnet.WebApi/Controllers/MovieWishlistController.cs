using System.Security.Claims;
using System.Text.Json;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Logging;

namespace angnet.WebApi.Controllers;

[ApiController]
[Route("api/Movie/Wishlist")]
[Authorize(Policy = "movie.view")]
[EnableRateLimiting("API")]
public class MovieWishlistController(IMovieWishlistService wishlist, ILogger<MovieWishlistController> logger) : ControllerBase
{
    [HttpGet]
    public Task<IActionResult> Browse(string keyword = "", int page = 1, CancellationToken cancellationToken = default) =>
        Respond(userId => wishlist.Browse(userId, keyword, page, cancellationToken));

    [HttpPut("{slug}")]
    public Task<IActionResult> Save(string slug, CancellationToken cancellationToken) =>
        Respond(userId => wishlist.Save(userId, slug, cancellationToken));

    [HttpDelete("{slug}")]
    public Task<IActionResult> Remove(string slug, CancellationToken cancellationToken) =>
        Respond(userId => wishlist.Remove(userId, slug, cancellationToken));

    private async Task<IActionResult> Respond<T>(Func<string, Task<T>> request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();
        try { return Ok(new ApiResponse<T>(await request(userId))); }
        catch (ArgumentException ex) { return BadRequest(new ApiResponse<T>(ex.Message)); }
        catch (KeyNotFoundException ex) { return NotFound(new ApiResponse<T>(ex.Message)); }
        catch (OperationCanceledException) when (HttpContext.RequestAborted.IsCancellationRequested) { return StatusCode(499); }
        catch (Exception ex) when (ex is HttpRequestException or OperationCanceledException or JsonException or InvalidOperationException)
        {
            logger.LogWarning(ex, "Movie wishlist request failed");
            return StatusCode(503, new ApiResponse<T>("Không thể cập nhật danh sách yêu thích lúc này. Vui lòng thử lại."));
        }
    }
}
