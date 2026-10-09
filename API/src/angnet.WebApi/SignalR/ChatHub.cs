
using angnet.Application.Interfaces.Repositories;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using angnet.Infrastructure.Data.Services;
using System.Security.Claims;

namespace angnet.WebApi.SignalR
{

    [Authorize(Policy = "chat.view")]
    public class ChatHub : Hub
    {
        private readonly IChatRepository _chatRespository;
        private readonly ChatConnections _connections;
        private readonly AccountSessionService _sessions;
        private readonly IAuthorizationService _authorization;

        public ChatHub(IChatRepository chatRespository, ChatConnections connections, AccountSessionService sessions, IAuthorizationService authorization)
        {
            this._chatRespository = chatRespository;
            _connections = connections;
            _sessions = sessions;
            _authorization = authorization;
        }

        public override async Task OnConnectedAsync()
        {
            if (Context.User is null || !await _connections.Allowed(Context.User, _sessions, _authorization)) {
                Context.Abort(); return;
            }
            _connections.Add(Context.ConnectionId, Context.User);
            await base.OnConnectedAsync();
        }
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _connections.Remove(Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }

        [Authorize(Policy = "chat.send")]
        public async Task SendMessage(string userId, string message, string type)
        {
            if (Context.User is null || !await _connections.Allowed(Context.User, _sessions, _authorization)
                || !(await _authorization.AuthorizeAsync(Context.User, null, "chat.send")).Succeeded)
                throw new HubException("Bạn không có quyền gửi tin hoặc phiên đã bị thu hồi.");
            var text = message?.Trim();
            if (string.IsNullOrEmpty(text) || text.Length > 4000 || (type != "string" && type != "jpg"))
                throw new HubException("Tin nhắn không hợp lệ (tối đa 4000 ký tự).");
            if (type == "jpg" && (!Uri.TryCreate(text, UriKind.Absolute, out var image) || image.Scheme != Uri.UriSchemeHttps))
                throw new HubException("Ảnh cần có địa chỉ HTTPS hợp lệ.");
            // Derive identity from the verified token; never trust the supplied sender.
            var result = await _chatRespository.SendMessage(ChatIdentity.Key(Context.User), text, type);
            if (!result.Success || result.Data is null) throw new HubException("Không thể lưu tin nhắn.");
            var recipients = await _connections.Recipients(_sessions, _authorization);
            await Clients.Clients(recipients).SendAsync("ReceiveMessage", result.Data);
        }

    }
}
