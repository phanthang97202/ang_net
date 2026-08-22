using angnet.Domain.Models;

namespace angnet.Application.Interfaces.Repositories
{
    public interface ISysParameterRespository : IBaseRespository<SysParameterModel>
    {
        (List<SysParameterModel> Data, int TotalCount) Search(int pageIndex, int pageSize, string keyword, string category);
    }
}
