using System.Security.Claims;
namespace angnet.WebApi.SignalR;
public static class ChatIdentity
{
    public static string AccountId(ClaimsPrincipal user) => user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException();
    public static string Key(ClaimsPrincipal user) => string.IsNullOrWhiteSpace(user.FindFirstValue(ClaimTypes.Email))
        ? $"account:{AccountId(user)}" : user.FindFirstValue(ClaimTypes.Email)!;
}
