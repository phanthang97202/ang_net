﻿using SharedModels.Dtos;
using SharedModels.Models;
using API.IRespositories;
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
        public async Task<ActionResult<ChatModel>> GetMessage(int PageIndex = 0, int PageSize = 10)
        {
            try
            {
                ApiResponse<ChatModel> response = await _chatRepository.GetMessage(PageIndex, PageSize);
                return Ok(response);
            }
            catch (System.Exception)
            {
                throw;
            }
        }
    }
}
