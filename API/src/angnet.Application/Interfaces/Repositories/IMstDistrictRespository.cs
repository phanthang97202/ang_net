using angnet.Domain.Dtos;
using angnet.Domain.Models;

namespace angnet.Application.Interfaces.Repositories
{
    public interface IMstDistrictRespository : IBaseRespository<MstDistrictModel>
    {
        public (List<MstDistrictModel> Data, int TotalCount) Search(int pageIndex, int pageSize, string keyword);
    }
}
