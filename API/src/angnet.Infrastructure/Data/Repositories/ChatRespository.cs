using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.EntityFrameworkCore;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;
using angnet.Application.Interfaces.Repositories;
using angnet.Infrastructure.Data;

namespace angnet.Infrastructure.Data.Repositories
{
    public class ChatRespository : IChatRepository
    {
        private readonly AppDbContext _dbContext;
        public ChatRespository(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }
        public async Task<ApiResponse<ChatModel>> SendMessage(string userId, string message, string type)
        {
            return await _dbContext.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
            {
                await using var transaction = await _dbContext.Database.BeginTransactionAsync();
                // Serialize room inserts before allocating the cursor. A later sequence
                // must not commit first and cause a read acknowledgement to skip an earlier message.
                if (_dbContext.Database.IsNpgsql())
                    await _dbContext.Database.ExecuteSqlRawAsync("LOCK TABLE \"Chat\" IN SHARE ROW EXCLUSIVE MODE");
                var data = new ChatModel
                {
                    UserId = userId, Message = message, Type = type,
                    CreatedDTime = TCommonUtils.DTimeNow()
                };
                await _dbContext.Chat.AddAsync(data);
                await _dbContext.SaveChangesAsync();
                await AttachSenderProfiles([data]);
                await transaction.CommitAsync();
                return new ApiResponse<ChatModel>(data);
            });
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
                                    .AsNoTracking()
                                    .OrderByDescending(c => c.Sequence)
                                    .Skip(pageIndex * pageSize)             // Skip pages based on page index
                                    .Take(pageSize)
                                    .Reverse()                      // Take the specified page size
                                    .ToListAsync();

            await AttachSenderProfiles(data);

            PageInfo<ChatModel> pageInfo = new PageInfo<ChatModel>();
            pageInfo.PageIndex = pageIndex;
            pageInfo.PageSize = pageSize;
            pageInfo.PageCount = itemCount % pageSize == 0 ? itemCount / pageSize : itemCount / pageSize + 1;
            pageInfo.ItemCount = itemCount;
            pageInfo.DataList = data;

            apiResponse.objResult = pageInfo;

            return apiResponse;
        }

        private async Task<ChatReadState> ReadState(string accountId)
        {
            var state = await _dbContext.ChatReadStates.AsNoTracking().SingleOrDefaultAsync(s => s.UserId == accountId);
            if (state is not null) return state;
            // First use starts at the current history; do not notify an entire old archive.
            state = new ChatReadState { UserId = accountId,
                LastReadSequence = await _dbContext.Chat.MaxAsync(c => (long?)c.Sequence) ?? 0 };
            _dbContext.ChatReadStates.Add(state);
            try { await _dbContext.SaveChangesAsync(); }
            catch (DbUpdateException) {
                _dbContext.Entry(state).State = EntityState.Detached;
                return await _dbContext.ChatReadStates.AsNoTracking().SingleAsync(s => s.UserId == accountId);
            }
            return state;
        }

        public async Task<ApiResponse<ChatNotificationDto>> Notifications(string accountId, string chatIdentity)
        {
            var state = await ReadState(accountId);
            var unread = _dbContext.Chat.AsNoTracking().Where(c => c.Sequence > state.LastReadSequence && c.UserId != chatIdentity);
            var count = await unread.CountAsync();
            var latest = await unread.OrderByDescending(c => c.Sequence).FirstOrDefaultAsync();
            if (latest is not null) await AttachSenderProfiles([latest]);
            return new(new ChatNotificationDto { UnreadCount = count, LatestMessage = latest });
        }

        private async Task AttachSenderProfiles(IReadOnlyCollection<ChatModel> messages)
        {
            if (messages.Count == 0) return;
            var identities = messages.Select(m => m.UserId).Distinct().ToArray();
            var users = await _dbContext.Users.AsNoTracking()
                .Where(u => identities.Contains(u.Email!) || identities.Contains("account:" + u.Id))
                .Select(u => new { u.Id, u.Email, u.FullName, u.UserName, u.Avatar }).ToListAsync();
            var profiles = users.SelectMany(u => new[] { u.Email, "account:" + u.Id }
                .Where(key => !string.IsNullOrWhiteSpace(key))
                .Select(key => new { Key = key!, Name = !string.IsNullOrWhiteSpace(u.FullName) ? u.FullName.Trim()
                    : !string.IsNullOrWhiteSpace(u.UserName) && !u.UserName.Contains('@') ? u.UserName : "Người dùng", u.Avatar }))
                .ToDictionary(u => u.Key, StringComparer.OrdinalIgnoreCase);
            foreach (var message in messages)
            {
                profiles.TryGetValue(message.UserId, out var profile);
                message.SenderName = profile?.Name ?? "Người dùng";
                message.SenderAvatar = profile?.Avatar;
            }
        }

        public async Task<ApiResponse<ChatNotificationDto>> MarkRead(string accountId, string chatIdentity, long sequence)
        {
            if (sequence < 0 || (sequence > 0 && !await _dbContext.Chat.AnyAsync(c => c.Sequence == sequence)))
                return new("Tin nhắn không tồn tại.");
            await ReadState(accountId);
            await _dbContext.ChatReadStates.Where(s => s.UserId == accountId && s.LastReadSequence < sequence)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.LastReadSequence, sequence));
            return await Notifications(accountId, chatIdentity);
        }
    }
}
