using SharedModels.Dtos;
using SharedModels.Models;

namespace API.Application.Interfaces.Repositories
{
    public interface IHashTagNewsRespository
    {
        public Task<ApiResponse<HashTagNewsModel>> GetTopHashTag();
    }
}
