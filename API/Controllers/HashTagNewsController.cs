using API.Dtos;
using API.Interfaces;
using API.IRespositories;
using API.Models;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    //[Authorize]
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