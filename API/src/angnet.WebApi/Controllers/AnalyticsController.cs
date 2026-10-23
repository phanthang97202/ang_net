using angnet.Domain.Dtos;
using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using angnet.WebApi.Filters;

namespace angnet.WebApi.Controllers;

[ApiController, Route("api/Analytics")]
public class AnalyticsController(WebAnalyticsService analytics) : ControllerBase
{
    [AllowAnonymous, HttpPost("Track"), EnableRateLimiting("AnalyticsTrack"), SkipLogging]
    public async Task<IActionResult> Track(AnalyticsTrackDto data)
    {
        if (!WebAnalyticsService.ValidContext(data.SessionId, data.NavigationId, data.Path)) return BadRequest();
        if (WebAnalyticsService.IsBot(Request.Headers.UserAgent.ToString())) return NoContent();
        if (data.PageView) await analytics.Record(data.SessionId, data.NavigationId, "page", "", "", data.Path);
        await analytics.Presence(data.SessionId);
        return NoContent();
    }

    [Authorize(Policy = "analytics.view"), HttpGet("Report"), EnableRateLimiting("API")]
    public async Task<IActionResult> Report(string from, string to, CancellationToken ct)
    {
        try { return Ok(new ApiResponse<AnalyticsReportDto>(await analytics.Report(from, to, ct))); }
        catch (ArgumentException ex) { return BadRequest(new ApiResponse<AnalyticsReportDto>(ex.Message)); }
    }
}
