
using angnet.Application.Interfaces.Repositories;
using Microsoft.AspNetCore.SignalR;

namespace angnet.WebApi.SignalR
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
        public async Task SendMessage(string userId, string message, string type)
        {
            await _chatRespository.SendMessage(userId, message, type);
            await Clients.All.SendAsync("ReceiveMessage", userId, message, type);
        }

    }
}
