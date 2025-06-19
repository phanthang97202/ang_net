using SharedModels.Dtos;
using SharedModels.Models;

namespace API.Application.Interfaces.Repositories
{
    public interface INewsCategoryRespository : IBaseRespository<NewsCategoryModel>
    {
        Task<List<NewsCategoryDto>> GetAllNewCategory();
    }
}
