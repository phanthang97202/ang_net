using API.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace API.SignalR
{
    //public class NotificationHub : Hub<INotificationClient>
    //{
    //    public override async Task OnConnectedAsync()
    //    {
    //        await Clients.All.ReceiveMessage($"{Context.ConnectionId} was connected!");
    //    }

    //    public async Task ReceiveMessage (string message)
    //    {
    //        await Clients.All.ReceiveMessage($"{Context.ConnectionId}::: {message}");
    //    }
    //}

    public class NotificationHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            await Clients.All.SendAsync("Connected successfully");
            await base.OnConnectedAsync();
        }
        public async Task SendMessage(string message, string user)
        {
              await Clients.All.SendAsync (message, user);
        }

    }
}
