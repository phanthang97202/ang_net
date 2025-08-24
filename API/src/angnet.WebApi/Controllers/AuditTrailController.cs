using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using angnet.Infrastructure.Data.Services;
using angnet.Application.Interfaces.Services;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class AuditTrailController : Controller
    {
        // (Separation of Concerns - SoC) → Controller chỉ nên điều phối yêu cầu,
        // còn Service xử lý logic, Repository thao tác dữ liệu.
        private readonly IAuditTrailService _AuditTrailService;
        public AuditTrailController(IAuditTrailService AuditTrailService)
        {
            _AuditTrailService = AuditTrailService;
        }

        [EnableRateLimitingAttribute("API")]
        [HttpGet("GetAllActive")]
        public async Task<ActionResult<AuditTrailModel>> GetAllActive()
        {
            try
            {
                ApiResponse<AuditTrailModel> response = await _AuditTrailService.GetAllActive();
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}
