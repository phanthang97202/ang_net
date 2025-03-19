using SharedModels.Dtos;
using SharedModels.Models;

namespace API.IRespositories
{
    public interface INewsCategoryRespository
    {
        public Task<ApiResponse<NewsCategoryDto>> GetAllActive();
    }
}
