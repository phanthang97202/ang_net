using angnet.Domain.Dtos;
using angnet.Domain.Models;

namespace angnet.Application.Interfaces.Repositories
{
    public interface IHashTagNewsRespository
    {
        public Task<ApiResponse<HashTagNewsModel>> GetTopHashTag();
    }
}
