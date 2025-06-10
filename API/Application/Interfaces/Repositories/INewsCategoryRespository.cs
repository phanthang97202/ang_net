using SharedModels.Dtos;
using SharedModels.Models;

namespace API.Application.Interfaces.Repositories
{
    public interface INewsCategoryRespository
    {
        public Task<ApiResponse<NewsCategoryDto>> GetAllActive();
    }
}
