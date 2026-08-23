using angnet.Domain.Dtos;
using angnet.Domain.Enums;
using angnet.Domain.Models;

namespace angnet.Application.Interfaces.Repositories
{
    // Giữ cách viết "Repository" theo đúng tên class stub đã có sẵn,
    // khác với "Respository" (sai chính tả) dùng ở các repo khác.
    public interface INewsCommentRepository : IBaseRespository<NewsCommentModel>
    {
        Task<(List<NewsCommentDto> Data, int ItemCount)> GetTopLevelComments(
            string newsId, int pageIndex, int pageSize, ENewsCommentSort sort,
            string currentUserId, DateTime? snapshot, int replyPreviewCount = 2);

        Task<(List<NewsCommentDto> Data, int ItemCount)> GetReplies(
            string rootCommentId, int pageIndex, int pageSize, string currentUserId);

        /// <summary>Tổng số bình luận đang hiển thị của bài viết (mọi cấp), dùng cho tiêu đề.</summary>
        Task<int> CountVisible(string newsId);

        Task AddComment(NewsCommentModel comment);

        Task<(bool Liked, int LikeCount)> ToggleLike(string commentId, string userId, DateTime now);

        Task<(bool Created, int ReportCount, bool AutoHidden)> AddReport(
            NewsReportCommentModel report, int threshold, DateTime now);
    }
}
