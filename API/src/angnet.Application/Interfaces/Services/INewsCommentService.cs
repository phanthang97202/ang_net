using System.Security.Claims;
using angnet.Domain.Dtos;

namespace angnet.Application.Interfaces.Services
{
    public interface INewsCommentService
    {
        public Task<ApiResponse<NewsCommentDto>> GetComments(
            ClaimsPrincipal user, string newsId, int pageIndex, int pageSize, string sort, DateTime? snapshot);
        public Task<ApiResponse<NewsCommentDto>> GetReplies(
            ClaimsPrincipal user, string commentId, int pageIndex, int pageSize);
        public Task<ApiResponse<NewsCommentDto>> AddComment(ClaimsPrincipal user, NewsCommentCreateDto data);
        public Task<ApiResponse<NewsCommentDto>> ToggleLike(ClaimsPrincipal user, string commentId);
        public Task<ApiResponse<NewsCommentDto>> ReportComment(ClaimsPrincipal user, NewsCommentReportCreateDto data);
        public Task<ApiResponse<NewsCommentDto>> DeleteComment(ClaimsPrincipal user, string commentId);
    }
}
