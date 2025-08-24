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
        Task<int> SaveChangesAsync(); // commit all changes into db
    }
}
