using angnet.Domain.Dtos;
using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers;

[ApiController, Route("api/AnalyticsHistory"), Authorize(Policy = "analytics.import"), EnableRateLimiting("API")]
public class AnalyticsHistoryController(AnalyticsLegacyService history) : ControllerBase
{
    [HttpGet, ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> Preview(CancellationToken ct) => Ok(new ApiResponse<AnalyticsReconciliationDto>(await history.Preview(ct)));

    [HttpPost("Import")]
    public async Task<IActionResult> Import(AnalyticsImportDto data, CancellationToken ct)
    {
        try { return Ok(new ApiResponse<AnalyticsReconciliationDto>(await history.Import(data.PlanToken, ct))); }
        catch (InvalidOperationException ex) { return Conflict(new ApiResponse<AnalyticsReconciliationDto>(ex.Message)); }
    }
}
