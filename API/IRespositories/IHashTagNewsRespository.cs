using SharedModels.Dtos;
using SharedModels.Models;

namespace API.IRespositories
{
    public interface IHashTagNewsRespository
    {
        public Task<ApiResponse<HashTagNewsModel>> GetTopHashTag();
    }
}
