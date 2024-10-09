using API.Interfaces;
using API.IRespositories;
using API.Models;
using API.Respositories;
using Microsoft.AspNetCore.SignalR;

namespace API.SignalR
{

    public class ChatHub : Hub
    {
        private readonly IChatRepository _chatRespository;

        public ChatHub(IChatRepository chatRespository)
        {
            this._chatRespository = chatRespository;
        }

        public override async Task OnConnectedAsync()
        {
            await Clients.All.SendAsync("Connected successfully");
            await base.OnConnectedAsync();
        }
        public async Task SendMessage(string userId, string message)
        {
            await _chatRespository.SendMessage(userId, message);
            await Clients.All.SendAsync("ReceiveMessage", userId, message);
        }

    }
}
