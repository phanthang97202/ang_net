using SharedModels.Dtos;
using SharedModels.Models;
using API.Interfaces;
using API.IRespositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HashTagNewsController : ControllerBase
    {
        private readonly IHashTagNewsRespository _hashTagNewsRespository;
        public HashTagNewsController(IHashTagNewsRespository hashTagNewsRespository)
        {
            _hashTagNewsRespository = hashTagNewsRespository;
        }
        
        [HttpGet("GetTopHashTag")]
        public async Task<ActionResult<HashTagNewsModel>> GetTopHashTag()
        {
            try
            {
                ApiResponse<HashTagNewsModel> response = await _hashTagNewsRespository.GetTopHashTag();
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
            }
        }
         
    }
}