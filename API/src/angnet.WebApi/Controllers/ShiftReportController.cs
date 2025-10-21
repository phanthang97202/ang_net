using angnet.Domain.Dtos;
using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace angnet.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShiftReportController : ControllerBase
    {
        private readonly IShiftReportService _service;
        private readonly ILogger<ShiftReportController> _logger;

        public ShiftReportController(
            IShiftReportService service,
            ILogger<ShiftReportController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Get all shift reports with filtering and pagination
        /// </summary>
        [HttpGet("GetAll")]
        [AllowAnonymous]
        public async Task<ActionResult<PagedResult<ShiftReportListDto>>> GetAll([FromQuery] ShiftReportQueryParams queryParams)
        {
            try
            {
                var result = await _service.GetAllAsync(queryParams);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting shift reports");
                return StatusCode(500, new { message = "An error occurred while retrieving shift reports" });
            }
        }

        /// <summary>
        /// Get shift report by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ShiftReportResponseDto>> GetById(int id)
        {
            try
            {
                var result = await _service.GetByIdAsync(id);
                return Ok(result);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = $"Shift report with ID {id} not found" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting shift report {Id}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the shift report" });
            }
        }

        /// <summary>
        /// Create new shift report
        /// </summary>
        [HttpPost("Create")]
        [AllowAnonymous]
        public async Task<ActionResult<ShiftReportResponseDto>> Create([FromBody] CreateShiftReportDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _service.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating shift report");
                return StatusCode(500, new { message = "An error occurred while creating the shift report" });
            }
        }

        /// <summary>
        /// Update existing shift report
        /// </summary>
        [HttpPut("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<ShiftReportResponseDto>> Update(int id, [FromBody] UpdateShiftReportDto dto)
        {
            try
            {
                if (id != dto.Id)
                    return BadRequest(new { message = "ID mismatch" });

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _service.UpdateAsync(dto);
                return Ok(result);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = $"Shift report with ID {id} not found" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating shift report {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the shift report" });
            }
        }

        /// <summary>
        /// Delete shift report
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            try
            {
                var result = await _service.DeleteAsync(id);
                if (!result)
                    return NotFound(new { message = $"Shift report with ID {id} not found" });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting shift report {Id}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the shift report" });
            }
        }

        /// <summary>
        /// Get shift report summary by date range
        /// </summary>
        [HttpGet("summary")]
        public async Task<ActionResult> GetSummary([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            try
            {
                var queryParams = new ShiftReportQueryParams
                {
                    FromDate = fromDate,
                    ToDate = toDate,
                    PageSize = int.MaxValue
                };

                var result = await _service.GetAllAsync(queryParams);

                var summary = new
                {
                    TotalReports = result.TotalCount,
                    TotalCash = result.Items.Sum(x => x.TotalCash),
                    TotalTransfer = result.Items.Sum(x => x.TotalTransfer),
                    TotalHandover = result.Items.Sum(x => x.HandoverAmount)
                };

                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting shift report summary");
                return StatusCode(500, new { message = "An error occurred while retrieving summary" });
            }
        }
    }
}
