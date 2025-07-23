using angnet.Domain.Dtos;
using angnet.Domain.Models;

namespace angnet.Application.Interfaces.Services
{
    public interface INewsCategoryService
    {
        public Task<ApiResponse<NewsCategoryModel>> Create(NewsCategoryModel data);
        public Task<ApiResponse<NewsCategoryDto>> GetAllActive();
    }
}
