using angnet.Application.Interfaces.Repositories;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace angnet.Infrastructure.Data.Repositories
{
    public class ReelRespository : BaseRepository<ReelModel>, IReelRespository
    {
        private readonly AppDbContext _dbContext;

        public ReelRespository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor) : base(appDbContext, httpContextAccessor)
        {
            _dbContext = appDbContext;
        }

        public async Task<(List<ReelDto> Data, string NextCursor, bool HasMore)> GetFeed(int pageSize, string cursor, string currentUserId)
        {
            IQueryable<ReelModel> query = _dbContext.Reel.AsNoTracking().Where(r => r.FlagActive);

            var _cursor = ReelCursor.Decode(cursor);
            if (_cursor != null)
            {
                DateTime cursorDTime = _cursor.Value.CreatedDTime;
                string cursorId = _cursor.Value.Id;
                query = query.Where(r => r.CreatedDTime < cursorDTime
                                         || (r.CreatedDTime == cursorDTime && string.Compare(r.ReelId, cursorId) < 0));
            }

            List<ReelDto> dataResult = await query
                .OrderByDescending(r => r.CreatedDTime)
                .ThenByDescending(r => r.ReelId)
                .Take(pageSize + 1) // lấy dư 1 để biết còn trang sau hay không
                .Select(r => new ReelDto
                {
                    ReelId = r.ReelId,
                    UserId = r.UserId,
                    UserFullName = _dbContext.Users.Where(u => u.Id == r.UserId).Select(u => u.FullName).FirstOrDefault(),
                    UserAvatar = _dbContext.Users.Where(u => u.Id == r.UserId).Select(u => u.Avatar).FirstOrDefault(),
                    Caption = r.Caption,
                    MediaType = r.MediaType,
                    CoverUrl = r.CoverUrl,
                    ViewCount = r.ViewCount,
                    LikeCount = r.LikeCount,
                    CommentCount = r.CommentCount,
                    IsLikedByMe = currentUserId != null && _dbContext.LikeReel.Any(l => l.ReelId == r.ReelId && l.UserId == currentUserId),
                    IsOwnedByMe = currentUserId != null && r.UserId == currentUserId,
                    CreatedDTime = r.CreatedDTime,
                })
                .ToListAsync();

            bool hasMore = dataResult.Count > pageSize;
            if (hasMore)
            {
                dataResult.RemoveAt(dataResult.Count - 1);
            }

            string nextCursor = hasMore && dataResult.Count > 0
                ? ReelCursor.Encode(dataResult[dataResult.Count - 1].CreatedDTime, dataResult[dataResult.Count - 1].ReelId)
                : null;

            return (dataResult, nextCursor, hasMore);
        }

        public async Task<ReelDto> GetDetail(string reelId, string currentUserId)
        {
            ReelDto reel = await _dbContext.Reel.AsNoTracking()
                .Where(r => r.ReelId == reelId && r.FlagActive)
                .Select(r => new ReelDto
                {
                    ReelId = r.ReelId,
                    UserId = r.UserId,
                    UserFullName = _dbContext.Users.Where(u => u.Id == r.UserId).Select(u => u.FullName).FirstOrDefault(),
                    UserAvatar = _dbContext.Users.Where(u => u.Id == r.UserId).Select(u => u.Avatar).FirstOrDefault(),
                    Caption = r.Caption,
                    MediaType = r.MediaType,
                    CoverUrl = r.CoverUrl,
                    ViewCount = r.ViewCount,
                    LikeCount = r.LikeCount,
                    CommentCount = r.CommentCount,
                    IsLikedByMe = currentUserId != null && _dbContext.LikeReel.Any(l => l.ReelId == r.ReelId && l.UserId == currentUserId),
                    IsOwnedByMe = currentUserId != null && r.UserId == currentUserId,
                    CreatedDTime = r.CreatedDTime,
                    Media = _dbContext.ReelMedia
                        .Where(m => m.ReelId == r.ReelId && m.FlagActive)
                        .OrderBy(m => m.SortOrder)
                        .Select(m => new ReelMediaDto
                        {
                            ReelMediaId = m.ReelMediaId,
                            MediaUrl = m.MediaUrl,
                            SortOrder = m.SortOrder,
                            DurationSeconds = m.DurationSeconds,
                            Width = m.Width,
                            Height = m.Height,
                        })
                        .ToList(),
                })
                .FirstOrDefaultAsync();

            return reel;
        }

        public async Task CreateWithMedia(ReelModel reel, List<ReelMediaModel> media)
        {
            await _dbContext.Reel.AddAsync(reel);
            await _dbContext.ReelMedia.AddRangeAsync(media);
        }

        /// <summary>
        /// Like/unlike đồng thời cập nhật Reel.LikeCount.
        /// Repo này tự commit (khác convention "repo không gọi SaveChanges") vì ExecuteUpdate/ExecuteDelete
        /// chạy thẳng xuống DB ngay lập tức, không nằm trong batch của SaveChangesAsync - nên phải tự bọc transaction
        /// để 2 thao tác không tách rời. Dùng ExecuteUpdate thay vì đọc-sửa-ghi để không mất lượt like khi nhiều
        /// người like cùng lúc.
        /// </summary>
        public async Task<(bool liked, int likeCount)> ToggleLike(string reelId, string userId, DateTime now)
        {
            using var transaction = await _dbContext.Database.BeginTransactionAsync();

            LikeReelModel existing = await _dbContext.LikeReel.AsNoTracking()
                                        .FirstOrDefaultAsync(l => l.ReelId == reelId && l.UserId == userId);

            bool liked;
            if (existing == null)
            {
                await _dbContext.LikeReel.AddAsync(new LikeReelModel
                {
                    ReelId = reelId,
                    UserId = userId,
                    FlagActive = true,
                    CreatedBy = userId,
                    UpdatedBy = userId,
                    CreatedDTime = now,
                    UpdatedDTime = now,
                });
                await _dbContext.SaveChangesAsync();

                await _dbContext.Reel.Where(r => r.ReelId == reelId)
                        .ExecuteUpdateAsync(s => s.SetProperty(r => r.LikeCount, r => r.LikeCount + 1));
                liked = true;
            }
            else
            {
                await _dbContext.LikeReel.Where(l => l.LikeReelId == existing.LikeReelId).ExecuteDeleteAsync();

                await _dbContext.Reel.Where(r => r.ReelId == reelId && r.LikeCount > 0)
                        .ExecuteUpdateAsync(s => s.SetProperty(r => r.LikeCount, r => r.LikeCount - 1));
                liked = false;
            }

            int likeCount = await _dbContext.Reel.Where(r => r.ReelId == reelId).Select(r => r.LikeCount).FirstOrDefaultAsync();

            await transaction.CommitAsync();

            return (liked, likeCount);
        }
    }
}
