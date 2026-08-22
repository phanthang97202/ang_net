using angnet.Domain.Dtos;
using angnet.Domain.Models;

namespace angnet.Application.Interfaces.Repositories
{
    public interface IReelCommentRespository : IBaseRespository<ReelCommentModel>
    {
        Task<(List<ReelCommentDto> Data, string NextCursor, bool HasMore)> GetTopLevelComments(string reelId, int pageSize, string cursor, string currentUserId, int replyPreviewCount = 2);
        Task<(List<ReelCommentDto> Data, string NextCursor, bool HasMore)> GetReplies(string parentCommentId, int pageSize, string cursor, string currentUserId);
        Task AddComment(ReelCommentModel comment);
    }
}
