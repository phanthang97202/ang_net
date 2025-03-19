using SharedModels.Dtos;
using SharedModels.Models;
using API.Data;
using API.IRespositories; 
using Microsoft.EntityFrameworkCore;
using TCommonUtils = CommonUtils.CommonUtils.CommonUtils;

namespace API.Respositories
{
    public class ChatRespository : IChatRepository
    {
        private readonly AppDbContext _dbContext;
        public ChatRespository(AppDbContext dbContext) {
            _dbContext = dbContext;
        }
        public async Task<ApiResponse<ChatModel>> SendMessage(string userId, string message, string type)
        {
            // throw new NotImplementedException();
            ApiResponse<ChatModel> apiResponse = new ApiResponse<ChatModel>();
            List<RequestClient> requestClient = new List<RequestClient>();
             
            ChatModel data = new ChatModel
            {
                UserId = userId,
                Message = message,
                Type = type,
                CreatedDTime = DateTime.Now
            };

            await _dbContext.Chat.AddAsync(data);
            await _dbContext.SaveChangesAsync();

            apiResponse.Data = data;

            return apiResponse;
        }

        public async Task<ApiResponse<ChatModel>> GetMessage(int pageIndex, int pageSize)
        {
            //pageIndex: 0, 1
            //pageSize: 5, 5
            //itemCount: 23, 23
            //pageCount: 5, 5
            // lấy 5 tin nhắn cuối  = bỏ 17 tin nhắn đầu = 0, itemCount - pageSize
            // lấy 5 tin nhắn cuối  = bỏ 12 tin nhắn đầu = 0, itemCount - pageSize
            // lấy 5 tin nhắn cuối  = bỏ 7 tin nhắn đầu = 0, itemCount - pageSize
            // lấy 5 tin nhắn cuối  = bỏ 2 tin nhắn đầu = 0, itemCount - pageSize
            // lấy 5 tin nhắn cuối  = bỏ 0 tin nhắn đầu = 0, itemCount - pageSize
            ApiResponse<ChatModel> apiResponse = new ApiResponse<ChatModel>();

            int itemCount = await _dbContext.Chat.CountAsync();

            List<ChatModel> data = await _dbContext.Chat
                                    .OrderByDescending(c => c.CreatedDTime) // Order from newest to oldest
                                    .Skip(pageIndex * pageSize)             // Skip pages based on page index
                                    .Take(pageSize)
                                    .Reverse()                      // Take the specified page size
                                    .ToListAsync();

            PageInfo<ChatModel> pageInfo = new PageInfo<ChatModel>();
            pageInfo.PageIndex = pageIndex;
            pageInfo.PageSize = pageSize;
            pageInfo.PageCount = itemCount % pageSize == 0 ? itemCount / pageSize : itemCount / pageSize + 1;
            pageInfo.ItemCount = itemCount;
            pageInfo.DataList = data;

            apiResponse.objResult = pageInfo; 

            return apiResponse;
        }
    }
}
