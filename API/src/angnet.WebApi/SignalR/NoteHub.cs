using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace angnet.WebApi.SignalR
{
    /// <summary>
    /// Kênh realtime công khai cho trang ghi chú. Client chỉ lắng nghe sự kiện;
    /// việc tạo ghi chú vẫn đi qua API để giữ nguyên validate và rate limit.
    /// </summary>
    [AllowAnonymous]
    public class NoteHub : Hub
    {
    }
}
