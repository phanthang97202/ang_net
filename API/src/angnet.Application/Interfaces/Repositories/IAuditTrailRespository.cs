using angnet.Domain.Models;

namespace angnet.Application.Interfaces.Repositories
{
    public interface IAuditTrailRespository : IBaseRespository<AuditTrailModel>
    {
        (List<AuditTrailModel> Data, int TotalCount) Search(
            int pageIndex
            , int pageSize
            , string keyword
            , string level
            , string trailType
        );
    }
}
