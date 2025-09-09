using angnet.Domain.Models;

namespace angnet.Application.Interfaces.Repositories
{
    public interface ITenantRepository: IBaseRespository<TenantModel>
    {
        public (List<TenantModel> Data, int TotalCount) Search(int pageIndex, int pageSize, string keyword);
    }
}
