using angnet.Domain.Dtos;
using angnet.Domain.Models;

namespace angnet.Application.Interfaces.Repositories
{
    public interface IMstProvinceRespository : IBaseRespository<MstProvinceModel>
    {
        public (List<MstProvinceModel> Data, int TotalCount) Search(int pageIndex, int pageSize, string keyword); 
    }
}