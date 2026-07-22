using angnet.Domain.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using angnet.Application.Interfaces.Repositories;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VisitStatsController : ControllerBase
    {
        private readonly IVisitStatsRespository _visitStatsRespository;
        public VisitStatsController(IVisitStatsRespository visitStatsRespository)
        {
            _visitStatsRespository = visitStatsRespository;
        }

        [AllowAnonymous]
        [EnableRateLimitingAttribute("VisitPing")]
        [HttpPost("Ping")]
        public async Task<IActionResult> Ping(string visitorId, bool isNewVisit)
        {
            try
            {
                ApiResponse<VisitStatsDto> response = await _visitStatsRespository.PingAsync(visitorId, isNewVisit);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}
