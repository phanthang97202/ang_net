using API.Dtos;
using API.Models;

namespace API.IRespositories
{
    public interface INewsRespository
    {
        public Task<ApiResponse<NewsModel>> Detail(string key);
        public Task<ApiResponse<NewsModel>> Create(NewsModel data);
    }
}
