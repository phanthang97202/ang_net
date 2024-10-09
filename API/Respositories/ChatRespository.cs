using API.CommonUtils;
using API.Data;
using API.Dtos;
using API.IRespositories;
using API.Models;
using Microsoft.EntityFrameworkCore;

namespace API.Respositories
{
    public class ChatRespository : IChatRepository
    {
        private readonly AppDbContext _dbContext;
        public ChatRespository(AppDbContext dbContext) {
            _dbContext = dbContext;
        }
        public async Task<ApiResponse<ChatModel>> SendMessage(string userId, string message)
        {
            // throw new NotImplementedException();
            ApiResponse<ChatModel> apiResponse = new ApiResponse<ChatModel>();
            List<RequestClient> requestClient = new List<RequestClient>();
             
            ChatModel data = new ChatModel
            {
                UserId = userId,
                Message = message,
                CreatedDTime = DateTime.Now
            };

            await _dbContext.Chat.AddAsync(data);
            await _dbContext.SaveChangesAsync();

            apiResponse.Data = data;

            return apiResponse;
        }

        public async Task<ApiResponse<ChatModel>> GetMessage(int quantity)
        {
            //pageIndex: 0
            //pageSize: 10
            //itemCount: 23
            //pageCount: 3
            // lấy 5 tin nhắn cuối  = bỏ 17 tin nhắn đầu = 0, itemCount - quantity
            ApiResponse<ChatModel> apiResponse = new ApiResponse<ChatModel>();

            int itemCount = await _dbContext.Chat.CountAsync();

            List<ChatModel> data = await _dbContext.Chat.Skip(itemCount - quantity).ToListAsync(); 

            apiResponse.DataList = data; 

            return apiResponse;
        }
    }
}
