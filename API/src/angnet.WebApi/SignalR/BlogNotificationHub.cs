using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace angnet.WebApi.SignalR;

[Authorize]
public class BlogNotificationHub(AccountSessionService sessions) : Hub
{
    public override async Task OnConnectedAsync()
    {
        if (Context.User == null || !await sessions.IsCurrent(Context.User))
        {
            Context.Abort();
            return;
        }
        await base.OnConnectedAsync();
    }
}
