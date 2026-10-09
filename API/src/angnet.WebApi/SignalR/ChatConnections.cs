using System.Collections.Concurrent;
using System.Security.Claims;
using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Authorization;
namespace angnet.WebApi.SignalR;
public class ChatConnections
{
    private readonly ConcurrentDictionary<string, ClaimsPrincipal> connections = new();
    public void Add(string id, ClaimsPrincipal user) => connections[id] = user;
    public void Remove(string id) => connections.TryRemove(id, out _);
    public async Task<bool> Allowed(ClaimsPrincipal user, AccountSessionService sessions, IAuthorizationService authorization)
    {
        var expiry = user.FindFirstValue("exp");
        return long.TryParse(expiry, out var seconds) && seconds > DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            && await sessions.IsCurrent(user) && (await authorization.AuthorizeAsync(user, null, "chat.view")).Succeeded;
    }
    public async Task<List<string>> Recipients(AccountSessionService sessions, IAuthorizationService authorization)
    {
        var result = new List<string>();
        // A socket established before account revocation must not keep receiving messages.
        foreach (var connection in connections)
            if (await Allowed(connection.Value, sessions, authorization)) result.Add(connection.Key);
        return result;
    }
}
