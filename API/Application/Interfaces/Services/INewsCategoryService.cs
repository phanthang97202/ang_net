using SharedModels.Dtos;
using SharedModels.Models;

namespace API.Application.Interfaces.Services
{
    public interface INewsCategoryService
    {
        public Task<ApiResponse<NewsCategoryModel>> Create(NewsCategoryModel data);
        public Task<ApiResponse<NewsCategoryDto>> GetAllActive();
    }
}
