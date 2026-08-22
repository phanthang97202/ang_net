using angnet.Domain.Dtos;
using angnet.Domain.Models;

namespace angnet.Application.Interfaces.Repositories
{
    public interface IReelRespository : IBaseRespository<ReelModel>
    {
        Task<(List<ReelDto> Data, string NextCursor, bool HasMore)> GetFeed(int pageSize, string cursor, string currentUserId);
        Task<ReelDto> GetDetail(string reelId, string currentUserId);
        Task CreateWithMedia(ReelModel reel, List<ReelMediaModel> media);
        Task<(bool liked, int likeCount)> ToggleLike(string reelId, string userId, DateTime now);
        Task<int> IncrementView(string reelId);
    }
}
