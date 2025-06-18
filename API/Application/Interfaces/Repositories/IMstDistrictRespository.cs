using SharedModels.Dtos;
using SharedModels.Models;

namespace API.Application.Interfaces.Repositories
{
    public interface IMstDistrictRespository : IBaseRespository<MstDistrictModel>
    {
        public Task<(List<MstDistrictModel> Data, int TotalCount)> Search(int pageIndex, int pageSize, string keyword);
    }
}
