using API.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace API.SignalR
{
    public class NotificationHub : Hub<INotificationClient>
    {
        public override async Task OnConnectedAsync()
        {
            await Clients.All.ReceiveMessage($"{Context.ConnectionId} was connected!");
        }

        public async Task ReceiveMessage (string message)
        {
            await Clients.All.ReceiveMessage($"{Context.ConnectionId}::: {message}");
        }
    }
}
