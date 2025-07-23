using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using angnet.Application.Interfaces.Repositories;

namespace angnet.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly IChatRepository _chatRepository;
        public ChatController(IChatRepository chatRepository)
        {
            _chatRepository = chatRepository;
        }

        [HttpGet("GetMessage")]
        public async Task<ActionResult<ChatModel>> GetMessage(int PageIndex = 0, int PageSize = 10)
        {
            try
            {
                ApiResponse<ChatModel> response = await _chatRepository.GetMessage(PageIndex, PageSize);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}
