using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Mvc;
using angnet.Application.Interfaces.Repositories;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Authorization;

namespace angnet.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [EnableRateLimitingAttribute("API")]
    public class HashTagNewsController : ControllerBase
    {
        private readonly IHashTagNewsRespository _hashTagNewsRespository;
        public HashTagNewsController(IHashTagNewsRespository hashTagNewsRespository)
        {
            _hashTagNewsRespository = hashTagNewsRespository;
        }

        [AllowAnonymous]
        [EnableRateLimitingAttribute("API")]
        [HttpGet("GetTopHashTag")]
        public async Task<ActionResult<HashTagNewsModel>> GetTopHashTag()
        {
            try
            {
                ApiResponse<HashTagNewsModel> response = await _hashTagNewsRespository.GetTopHashTag();
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

    }
}