using angnet.Application.Interfaces.Repositories;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace angnet.Infrastructure.Data.Repositories
{
    public class ReelCommentRespository : BaseRepository<ReelCommentModel>, IReelCommentRespository
    {
        private readonly AppDbContext _dbContext;

        public ReelCommentRespository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor) : base(appDbContext, httpContextAccessor)
        {
            _dbContext = appDbContext;
        }

        public async Task<(List<ReelCommentDto> Data, string NextCursor, bool HasMore)> GetTopLevelComments(
            string reelId, int pageSize, string cursor, string currentUserId, int replyPreviewCount = 2)
        {
            IQueryable<ReelCommentModel> query = _dbContext.ReelComment.AsNoTracking()
                                                    .Where(c => c.ReelId == reelId && c.FlagActive && c.ParentCommentId == null);

            var (dataResult, nextCursor, hasMore) = await Page(query, pageSize, cursor, currentUserId);

            if (replyPreviewCount > 0 && dataResult.Count > 0)
            {
                List<string> parentIds = dataResult.Where(c => c.ReplyCount > 0).Select(c => c.CommentId).ToList();
                foreach (string parentId in parentIds)
                {
                    List<ReelCommentDto> replies = await Project(
                        _dbContext.ReelComment.AsNoTracking().Where(c => c.ParentCommentId == parentId && c.FlagActive),
                        currentUserId)
                        .OrderBy(c => c.CreatedDTime)
                        .ThenBy(c => c.CommentId)
                        .Take(replyPreviewCount)
                        .ToListAsync();

                    dataResult.First(c => c.CommentId == parentId).Replies = replies;
                }
            }

            return (dataResult, nextCursor, hasMore);
        }

        public async Task<(List<ReelCommentDto> Data, string NextCursor, bool HasMore)> GetReplies(
            string parentCommentId, int pageSize, string cursor, string currentUserId)
        {
            IQueryable<ReelCommentModel> query = _dbContext.ReelComment.AsNoTracking()
                                                    .Where(c => c.ParentCommentId == parentCommentId && c.FlagActive);

            return await Page(query, pageSize, cursor, currentUserId);
        }

        /// <summary>
        /// Thêm comment đồng thời cập nhật Reel.CommentCount (và ReelComment.ReplyCount nếu là reply).
        /// Tự commit trong repo vì lý do giống ReelRespository.ToggleLike: ExecuteUpdate chạy ngay xuống DB,
        /// nằm ngoài batch của SaveChangesAsync nên cần transaction bọc thủ công.
        /// </summary>
        public async Task AddComment(ReelCommentModel comment)
        {
            // DbContext bật EnableRetryOnFailure (Program.cs) nên không được tự gọi
            // BeginTransaction trần - phải chạy trong CreateExecutionStrategy để cả khối
            // được retry như một đơn vị. Thiếu bước này thì mọi lượt bình luận đều lỗi 500.
            var strategy = _dbContext.Database.CreateExecutionStrategy();

            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _dbContext.Database.BeginTransactionAsync();

                await _dbContext.ReelComment.AddAsync(comment);
                await _dbContext.SaveChangesAsync();

                await _dbContext.Reel.Where(r => r.ReelId == comment.ReelId)
                        .ExecuteUpdateAsync(s => s.SetProperty(r => r.CommentCount, r => r.CommentCount + 1));

                if (comment.ParentCommentId != null)
                {
                    await _dbContext.ReelComment.Where(c => c.CommentId == comment.ParentCommentId)
                            .ExecuteUpdateAsync(s => s.SetProperty(c => c.ReplyCount, c => c.ReplyCount + 1));
                }

                await transaction.CommitAsync();
            });
        }

        // Comment sắp xếp cũ -> mới (ngược với feed reel), cursor cũng so sánh theo chiều tăng dần.
        private async Task<(List<ReelCommentDto> Data, string NextCursor, bool HasMore)> Page(
            IQueryable<ReelCommentModel> query, int pageSize, string cursor, string currentUserId)
        {
            var _cursor = ReelCursor.Decode(cursor);
            if (_cursor != null)
            {
                DateTime cursorDTime = _cursor.Value.CreatedDTime;
                string cursorId = _cursor.Value.Id;
                query = query.Where(c => c.CreatedDTime > cursorDTime
                                         || (c.CreatedDTime == cursorDTime && string.Compare(c.CommentId, cursorId) > 0));
            }

            List<ReelCommentDto> dataResult = await Project(query, currentUserId)
                .OrderBy(c => c.CreatedDTime)
                .ThenBy(c => c.CommentId)
                .Take(pageSize + 1)
                .ToListAsync();

            bool hasMore = dataResult.Count > pageSize;
            if (hasMore)
            {
                dataResult.RemoveAt(dataResult.Count - 1);
            }

            string nextCursor = hasMore && dataResult.Count > 0
                ? ReelCursor.Encode(dataResult[dataResult.Count - 1].CreatedDTime, dataResult[dataResult.Count - 1].CommentId)
                : null;

            return (dataResult, nextCursor, hasMore);
        }

        private IQueryable<ReelCommentDto> Project(IQueryable<ReelCommentModel> query, string currentUserId)
        {
            return query.Select(c => new ReelCommentDto
            {
                CommentId = c.CommentId,
                ReelId = c.ReelId,
                UserId = c.UserId,
                UserFullName = _dbContext.Users.Where(u => u.Id == c.UserId).Select(u => u.FullName).FirstOrDefault(),
                UserAvatar = _dbContext.Users.Where(u => u.Id == c.UserId).Select(u => u.Avatar).FirstOrDefault(),
                ParentCommentId = c.ParentCommentId,
                Content = c.Content,
                ReplyCount = c.ReplyCount,
                IsOwnedByMe = currentUserId != null && c.UserId == currentUserId,
                CreatedDTime = c.CreatedDTime,
            });
        }
    }
}
