using angnet.Domain.Dtos;
using angnet.Domain.Models;

namespace angnet.Application.Interfaces.Services
{
    public interface INewsCategoryService
    {
        public Task<ApiResponse<NewsCategoryModel>> Create(NewsCategoryModel data);
        public Task<ApiResponse<NewsCategoryDto>> GetAllActive();
        public ApiResponse<NewsCategoryModel> Search(int pageIndex, int pageSize, string keyword);
        public Task<ApiResponse<NewsCategoryModel>> Detail(string newsCategoryId);
        public Task<ApiResponse<NewsCategoryModel>> Update(NewsCategoryModel data);
        public Task<ApiResponse<NewsCategoryModel>> Delete(string newsCategoryId);
    }
}
