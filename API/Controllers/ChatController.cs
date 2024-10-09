using API.Dtos;
using API.IRespositories;
using API.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly IChatRepository _chatRepository;
        public ChatController(IChatRepository chatRepository)
        {
            this._chatRepository = chatRepository;
        }

        [HttpGet("GetMessage")]
        public async Task<ActionResult<ChatModel>> GetMessage(int quantity)
        {
            try
            {
                ApiResponse<ChatModel> response = await _chatRepository.GetMessage(quantity);
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
            }
        }
    }
}
