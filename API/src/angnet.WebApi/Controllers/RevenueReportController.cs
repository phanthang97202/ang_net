using angnet.Domain.Dtos;
using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace angnet.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RevenueReportsController : ControllerBase
    {
        private readonly IRevenueReportService _service;
        private readonly ILogger<RevenueReportsController> _logger;

        public RevenueReportsController(
            IRevenueReportService service,
            ILogger<RevenueReportsController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Get revenue report with filters
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<RevenueReportResponse>> GetRevenueReport([FromQuery] RevenueReportQueryParams queryParams)
        {
            try
            {
                var result = await _service.GetRevenueReportAsync(queryParams);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting revenue report");
                return StatusCode(500, new { message = "An error occurred while retrieving revenue report" });
            }
        }
    }
}
