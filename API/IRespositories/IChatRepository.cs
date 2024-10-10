using API.Dtos;
using API.Models;

namespace API.IRespositories
{
    public interface IChatRepository
    {
        public Task<ApiResponse<ChatModel>> SendMessage(string userId, string message);
        public Task<ApiResponse<ChatModel>> GetMessage(int pageIndex, int pageSize);
         
    }
}
