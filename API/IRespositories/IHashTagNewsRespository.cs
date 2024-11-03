using API.Dtos;
using API.Models;

namespace API.IRespositories
{
    public interface IHashTagNewsRespository
    {
        public Task<ApiResponse<HashTagNewsModel>> GetTopHashTag();
    }
}
