using SharedModels.Dtos;
using SharedModels.Models;
using Microsoft.AspNetCore.Mvc;
using API.Application.Interfaces.Repositories;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Authorization;

namespace API.API.Controllers
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