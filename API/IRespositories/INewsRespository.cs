using API.Dtos;
using API.Models;
using System.Security.Claims;

namespace API.IRespositories
{
    public interface INewsRespository
    {
        public Task<ApiResponse<RPNewsDto>> Detail(string key);
        public Task<ApiResponse<NewsModel>> Create(ClaimsPrincipal User, NewsDto data);
    }
}
