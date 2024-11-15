using API.Dtos;
using API.Models;

namespace API.IRespositories
{
    public interface INewsCategoryRespository
    {
        public Task<ApiResponse<NewsCategoryDto>> GetAllActive();
    }
}
