using SharedModels.Dtos;
using SharedModels.Models;

namespace API.Application.Interfaces.Repositories
{
    public interface IMstProvinceRespository : IBaseRespository<MstProvinceModel>
    {
        public Task<(List<MstProvinceModel> Data, int TotalCount)> Search(int pageIndex, int pageSize, string keyword); 
    }
}