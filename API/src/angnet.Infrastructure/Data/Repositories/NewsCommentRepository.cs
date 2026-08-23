using angnet.Application.Interfaces.Repositories;
using angnet.Domain.Dtos;
using angnet.Domain.Enums;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace angnet.Infrastructure.Data.Repositories
{
    public class NewsCommentRepository : BaseRepository<NewsCommentModel>, INewsCommentRepository
    {
        private readonly AppDbContext _dbContext;

        public NewsCommentRepository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor)
            : base(appDbContext, httpContextAccessor)
        {
            _dbContext = appDbContext;
        }

        /// <summary>
        /// Bình luận coi là "còn tồn tại" (chưa xoá). Bình luận bị ẩn - do báo cáo quá ngưỡng
        /// hoặc tác giả bị vô hiệu hoá - vẫn nằm trong tập này để nhánh trả lời bên dưới
        /// không bị mồ côi; việc ẩn nội dung xử lý ở Project().
        /// </summary>
        private IQueryable<NewsCommentModel> Alive(IQueryable<NewsCommentModel> query)
        {
            return query.Where(c => c.FlagActive && c.Status != ENewsCommentStatus.Deleted);
        }

        private IQueryable<NewsCommentDto> Project(IQueryable<NewsCommentModel> query, string currentUserId)
        {
            return query.Select(c => new NewsCommentDto
            {
                CommentId = c.CommentId,
                NewsId = c.NewsId,
                UserId = c.UserId,
                UserFullName = _dbContext.Users.Where(u => u.Id == c.UserId).Select(u => u.FullName).FirstOrDefault(),
                UserAvatar = _dbContext.Users.Where(u => u.Id == c.UserId).Select(u => u.Avatar).FirstOrDefault(),
                ParentCommentId = c.ParentCommentId,

                IsHidden = c.Status == ENewsCommentStatus.Rejected
                           || !_dbContext.Users.Any(u => u.Id == c.UserId && u.FlagActive),

                // Xoá trắng nội dung ngay tại server: không bao giờ gửi nội dung bị ẩn xuống client
                Content = (c.Status == ENewsCommentStatus.Rejected
                           || !_dbContext.Users.Any(u => u.Id == c.UserId && u.FlagActive))
                          ? string.Empty
                          : c.Content,

                LikeCount = _dbContext.NewsCommentReaction.Count(r =>
                                r.CommentId == c.CommentId
                                && r.ReactionType == ENewsCommentReaction.Like
                                && _dbContext.Users.Any(u => u.Id == r.UserId && u.FlagActive)),

                ReplyCount = _dbContext.NewsComment.Count(x =>
                                x.ParentCommentId == c.CommentId
                                && x.FlagActive
                                && x.Status != ENewsCommentStatus.Deleted),

                IsLikedByMe = currentUserId != null
                              && _dbContext.NewsCommentReaction.Any(r =>
                                    r.CommentId == c.CommentId && r.UserId == currentUserId),
                IsOwnedByMe = currentUserId != null && c.UserId == currentUserId,

                CreatedDTime = c.CreatedDTime,
            });
        }

        public async Task<(List<NewsCommentDto> Data, int ItemCount)> GetTopLevelComments(
            string newsId, int pageIndex, int pageSize, ENewsCommentSort sort,
            string currentUserId, DateTime? snapshot, int replyPreviewCount = 2)
        {
            IQueryable<NewsCommentModel> query = Alive(_dbContext.NewsComment.AsNoTracking())
                                                    .Where(c => c.NewsId == newsId && c.ParentCommentId == null);

            // Mốc thời gian chụp ở lần tải đầu: bình luận mới đăng trong lúc người đọc đang
            // cuộn sẽ không chen vào giữa làm lệch offset và lặp lại dòng đã hiển thị.
            if (snapshot != null)
            {
                DateTime _snapshot = snapshot.Value;
                query = query.Where(c => c.CreatedDTime <= _snapshot);
            }

            // Bình luận bị ẩn mà không còn trả lời nào thì bỏ hẳn khỏi danh sách;
            // còn trả lời thì giữ lại làm "bia" để không mất cả nhánh bên dưới.
            query = query.Where(c => !(c.Status == ENewsCommentStatus.Rejected
                                       || !_dbContext.Users.Any(u => u.Id == c.UserId && u.FlagActive))
                                     || _dbContext.NewsComment.Any(x => x.ParentCommentId == c.CommentId
                                                                        && x.FlagActive
                                                                        && x.Status != ENewsCommentStatus.Deleted));

            int itemCount = await query.CountAsync();

            IQueryable<NewsCommentDto> projected = Project(query, currentUserId);

            projected = sort == ENewsCommentSort.Popular
                ? projected.OrderByDescending(c => c.LikeCount)
                           .ThenByDescending(c => c.CreatedDTime)
                           .ThenBy(c => c.CommentId)
                : projected.OrderByDescending(c => c.CreatedDTime)
                           .ThenBy(c => c.CommentId);

            List<NewsCommentDto> dataResult = await projected
                                                    .Skip(pageIndex * pageSize)
                                                    .Take(pageSize)
                                                    .ToListAsync();

            // Kèm sẵn vài trả lời đầu để người đọc thấy ngay mà không phải bấm mở
            if (replyPreviewCount > 0 && dataResult.Count > 0)
            {
                foreach (NewsCommentDto root in dataResult)
                {
                    (List<NewsCommentDto> replies, _) = await GetReplies(
                        root.CommentId, 0, replyPreviewCount, currentUserId);
                    root.Replies = replies;
                }
            }

            return (dataResult, itemCount);
        }

        public async Task<(List<NewsCommentDto> Data, int ItemCount)> GetReplies(
            string rootCommentId, int pageIndex, int pageSize, string currentUserId)
        {
            IQueryable<NewsCommentModel> query = Alive(_dbContext.NewsComment.AsNoTracking())
                                                    .Where(c => c.ParentCommentId == rootCommentId);

            int itemCount = await query.CountAsync();

            // Trả lời luôn xếp cũ -> mới để đọc theo mạch hội thoại
            List<NewsCommentDto> dataResult = await Project(query, currentUserId)
                                                    .OrderBy(c => c.CreatedDTime)
                                                    .ThenBy(c => c.CommentId)
                                                    .Skip(pageIndex * pageSize)
                                                    .Take(pageSize)
                                                    .ToListAsync();

            return (dataResult, itemCount);
        }

        public async Task<int> CountVisible(string newsId)
        {
            return await Alive(_dbContext.NewsComment.AsNoTracking())
                            .Where(c => c.NewsId == newsId)
                            .Where(c => c.Status != ENewsCommentStatus.Rejected
                                        && _dbContext.Users.Any(u => u.Id == c.UserId && u.FlagActive))
                            .CountAsync();
        }

        /// <summary>
        /// Thêm bình luận. Bọc trong CreateExecutionStrategy vì DbContext bật
        /// EnableRetryOnFailure (Program.cs) - gọi BeginTransaction trần sẽ lỗi 500 lúc chạy.
        /// </summary>
        public async Task AddComment(NewsCommentModel comment)
        {
            var strategy = _dbContext.Database.CreateExecutionStrategy();

            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _dbContext.Database.BeginTransactionAsync();

                await _dbContext.NewsComment.AddAsync(comment);
                await _dbContext.SaveChangesAsync();

                await transaction.CommitAsync();
            });
        }

        /// <summary>Thả/bỏ tim. Cũng cần execution strategy vì ghép nhiều câu lệnh trong 1 transaction.</summary>
        public async Task<(bool Liked, int LikeCount)> ToggleLike(string commentId, string userId, DateTime now)
        {
            var strategy = _dbContext.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _dbContext.Database.BeginTransactionAsync();

                NewsCommentReactionModel existing = await _dbContext.NewsCommentReaction
                                                        .AsNoTracking()
                                                        .FirstOrDefaultAsync(r => r.CommentId == commentId
                                                                                  && r.UserId == userId);

                bool liked;
                if (existing == null)
                {
                    await _dbContext.NewsCommentReaction.AddAsync(new NewsCommentReactionModel
                    {
                        CommentId = commentId,
                        UserId = userId,
                        ReactionType = ENewsCommentReaction.Like,
                        FlagActive = true,
                        CreatedBy = userId,
                        UpdatedBy = userId,
                        CreatedDTime = now,
                        UpdatedDTime = now,
                    });
                    await _dbContext.SaveChangesAsync();
                    liked = true;
                }
                else
                {
                    await _dbContext.NewsCommentReaction
                            .Where(r => r.CommentId == commentId && r.UserId == userId)
                            .ExecuteDeleteAsync();
                    liked = false;
                }

                int likeCount = await _dbContext.NewsCommentReaction
                                    .CountAsync(r => r.CommentId == commentId
                                                     && r.ReactionType == ENewsCommentReaction.Like
                                                     && _dbContext.Users.Any(u => u.Id == r.UserId && u.FlagActive));

                await transaction.CommitAsync();

                return (liked, likeCount);
            });
        }

        /// <summary>
        /// Ghi nhận báo cáo rồi tự ẩn bình luận nếu đủ ngưỡng. Toàn bộ đọc-sửa-ghi phải nằm
        /// trong một đơn vị retry được (EnableRetryOnFailure đang bật).
        /// </summary>
        public async Task<(bool Created, int ReportCount, bool AutoHidden)> AddReport(
            NewsReportCommentModel report, int threshold, DateTime now)
        {
            var strategy = _dbContext.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _dbContext.Database.BeginTransactionAsync();

                bool created = false;
                bool alreadyReported = await _dbContext.NewsReportComment
                                            .AnyAsync(r => r.CommentId == report.CommentId
                                                           && r.UserId == report.UserId);

                if (!alreadyReported)
                {
                    await _dbContext.NewsReportComment.AddAsync(report);
                    await _dbContext.SaveChangesAsync();
                    created = true;
                }

                int reportCount = await _dbContext.NewsReportComment
                                        .CountAsync(r => r.CommentId == report.CommentId
                                                         && r.Status != ENewsCommentReportStatus.Dismissed);

                bool autoHidden = false;
                if (reportCount >= threshold)
                {
                    int affected = await _dbContext.NewsComment
                                        .Where(c => c.CommentId == report.CommentId
                                                    && c.Status != ENewsCommentStatus.Rejected)
                                        .ExecuteUpdateAsync(s => s
                                            .SetProperty(c => c.Status, ENewsCommentStatus.Rejected)
                                            .SetProperty(c => c.UpdatedBy, report.UserId)
                                            .SetProperty(c => c.UpdatedDTime, now));
                    autoHidden = affected > 0;
                }

                await transaction.CommitAsync();

                return (created, reportCount, autoHidden);
            });
        }
    }
}
