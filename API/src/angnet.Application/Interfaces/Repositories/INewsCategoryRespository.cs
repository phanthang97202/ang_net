using angnet.Domain.Dtos;
using angnet.Domain.Models;

namespace angnet.Application.Interfaces.Repositories
{
    public interface INewsCategoryRespository : IBaseRespository<NewsCategoryModel>
    {
        Task<List<NewsCategoryDto>> GetAllNewCategory();
    }
}
