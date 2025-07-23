using angnet.Domain.Dtos;
using angnet.Domain.Models;
using System.Security.Claims;

namespace angnet.Application.Interfaces.Repositories
{
    public interface INewsRespository
    {
        public Task<ApiResponse<RPNewsDto>> Search(int pageIndex, int pageSize, string keyword, string userId, string categoryId);
        public Task<ApiResponse<RPNewsDto>> Detail(string newsId);
        public Task<ApiResponse<NewsModel>> Create(ClaimsPrincipal User, NewsDto data);
        public Task<ApiResponse<NewsModel>> Like(ClaimsPrincipal User, string newsId);
        public Task<ApiResponse<NewsModel>> Point(ClaimsPrincipal User, string newsId, double point);
    }
}
