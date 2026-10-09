using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using angnet.Application.Interfaces.Repositories;
using Microsoft.AspNetCore.Authorization;
using angnet.WebApi.SignalR;

namespace angnet.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = "chat.view")]
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
            if (PageIndex < 0 || PageSize is < 1 or > 100) return BadRequest();
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

        [HttpGet("notifications")]
        public async Task<IActionResult> Notifications() => Ok(await _chatRepository.Notifications(ChatIdentity.AccountId(User), ChatIdentity.Key(User)));

        [HttpPost("read")]
        public async Task<IActionResult> MarkRead(ChatReadDto request) => Ok(await _chatRepository.MarkRead(ChatIdentity.AccountId(User), ChatIdentity.Key(User), request.Sequence));
    }
}
