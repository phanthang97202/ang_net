using System.Security.Claims;
using angnet.Domain.Dtos;

namespace angnet.Application.Interfaces.Services
{
    public interface IReelService
    {
        public Task<ApiResponse<ReelDto>> GetFeed(ClaimsPrincipal user, int pageSize, string cursor);
        public Task<ApiResponse<ReelDto>> Detail(ClaimsPrincipal user, string reelId);
        public Task<ApiResponse<ReelDto>> Create(ClaimsPrincipal user, ReelCreateDto data);
        public Task<ApiResponse<ReelDto>> Delete(ClaimsPrincipal user, string reelId);
        public Task<ApiResponse<ReelDto>> ToggleLike(ClaimsPrincipal user, string reelId);
        public Task<ApiResponse<ReelDto>> IncrementView(ClaimsPrincipal user, string reelId);
        public Task<ApiResponse<ReelCommentDto>> GetComments(ClaimsPrincipal user, string reelId, int pageSize, string cursor);
        public Task<ApiResponse<ReelCommentDto>> GetReplies(ClaimsPrincipal user, string commentId, int pageSize, string cursor);
        public Task<ApiResponse<ReelCommentDto>> AddComment(ClaimsPrincipal user, ReelCommentCreateDto data);
    }
}
