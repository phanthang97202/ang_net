using angnet.Domain.Dtos;
using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace angnet.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RentalStatisticsController(IShiftReportService service, ILogger<RentalStatisticsController> logger) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = "rentalstatistics.view")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<ActionResult<ShiftRentalStatisticsDto>> GetRentalStatistics([FromQuery] ShiftRentalStatisticsQuery query, CancellationToken ct)
    {
        try { return Ok(await service.GetRentalStatisticsAsync(query, ct)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting rental statistics");
            return StatusCode(500, new { message = "Không thể tải thống kê thuê phòng. Vui lòng thử lại." });
        }
    }

}
