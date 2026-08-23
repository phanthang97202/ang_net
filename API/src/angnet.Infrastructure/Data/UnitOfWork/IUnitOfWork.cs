using angnet.Application.Interfaces.Repositories; 

namespace angnet.Infrastructure.Data.UnitOfWork
{
    public interface IUnitOfWork : IDisposable
    {
        IMstProvinceRespository MstProvinceRespository { get; }
        IMstStadiumStatusRespository MstStadiumStatusRespository { get; }
        IMstStadiumTypeRespository MstStadiumTypeRespository { get; }
        IMstStadiumRespository MstStadiumRespository { get; }
        IMstDistrictRespository MstDistrictRespository { get; }
        INewsCategoryRespository NewsCategoryRespository { get; }
        IAuditTrailRespository AuditTrailRespository { get; }
        ITenantRepository TenantRepository { get; }
        ISysParameterRespository SysParameterRespository { get; }
        IReelRespository ReelRespository { get; }
        IReelCommentRespository ReelCommentRespository { get; }
        INewsCommentRepository NewsCommentRepository { get; }
        Task<int> SaveChangesAsync(); // commit all changes into db
    }
}
