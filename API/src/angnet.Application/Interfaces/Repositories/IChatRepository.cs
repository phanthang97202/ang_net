using angnet.Domain.Dtos;
using angnet.Domain.Models;

namespace angnet.Application.Interfaces.Repositories
{
    public interface IChatRepository
    {
        public Task<ApiResponse<ChatModel>> SendMessage(string userId, string message, string type);
        public Task<ApiResponse<ChatModel>> GetMessage(int pageIndex, int pageSize, long? beforeSequence = null);
        public Task<ApiResponse<ChatDeletedDto>> SoftDelete(string messageId, string actorId);
        public Task<ApiResponse<ChatNotificationDto>> Notifications(string accountId, string chatIdentity);
        public Task<ApiResponse<ChatNotificationDto>> MarkRead(string accountId, string chatIdentity, long sequence);

    }
}
