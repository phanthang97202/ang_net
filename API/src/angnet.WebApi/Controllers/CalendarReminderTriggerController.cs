using System.Security.Cryptography;
using System.Text;
using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/internal/calendar-reminders")]
[EnableRateLimiting("CalendarReminderTrigger")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class CalendarReminderTriggerController(
    IPersonalCalendarReminderService reminderService,
    IConfiguration configuration,
    ILogger<CalendarReminderTriggerController> logger) : ControllerBase
{
    public const string SecretHeader = "X-Calendar-Cron-Secret";

    [HttpPost("run")]
    public async Task<IActionResult> Run(
        [FromHeader(Name = SecretHeader)] string? suppliedSecret,
        CancellationToken cancellationToken)
        => await RunCore(suppliedSecret, cancellationToken);

    // UptimeRobot Free only sends HEAD requests and cannot attach custom headers.
    // GET is also accepted because UptimeRobot may retry a failed HEAD request as GET.
    [HttpHead("ping")]
    [HttpGet("ping")]
    public async Task<IActionResult> Ping(
        [FromQuery] string? token,
        CancellationToken cancellationToken)
        => await RunCore(token, cancellationToken);

    private async Task<IActionResult> RunCore(
        string? suppliedSecret,
        CancellationToken cancellationToken)
    {
        var configuredSecret = configuration["CalendarReminder:TriggerSecret"];
        if (string.IsNullOrWhiteSpace(configuredSecret))
        {
            logger.LogError("Calendar reminder trigger secret is not configured");
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { Code = "CalendarReminderNotConfigured" });
        }

        if (!SecretEquals(configuredSecret, suppliedSecret))
        {
            return Unauthorized(new { Code = "InvalidTriggerSecret" });
        }

        try
        {
            var result = await reminderService.RunAsync(cancellationToken);
            return result.Failed > 0
                ? StatusCode(StatusCodes.Status502BadGateway, result)
                : Ok(result);
        }
        catch (CalendarReminderConfigurationException exception)
        {
            logger.LogError(exception, "Calendar reminder configuration is invalid");
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { Code = "CalendarReminderNotConfigured" });
        }
    }

    private static bool SecretEquals(string expected, string? supplied)
    {
        if (string.IsNullOrEmpty(supplied)) return false;
        var expectedHash = SHA256.HashData(Encoding.UTF8.GetBytes(expected));
        var suppliedHash = SHA256.HashData(Encoding.UTF8.GetBytes(supplied));
        return CryptographicOperations.FixedTimeEquals(expectedHash, suppliedHash);
    }
}
