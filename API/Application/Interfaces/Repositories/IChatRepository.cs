using SharedModels.Dtos;
using SharedModels.Models;

namespace API.Application.Interfaces.Repositories
{
    public interface IChatRepository
    {
        public Task<ApiResponse<ChatModel>> SendMessage(string userId, string message, string type);
        public Task<ApiResponse<ChatModel>> GetMessage(int pageIndex, int pageSize);

    }
}
