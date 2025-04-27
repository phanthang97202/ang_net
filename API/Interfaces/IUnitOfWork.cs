using API.IRespositories;

namespace API.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        IMstStadiumStatusRespository MstStadiumStatusRespository { get; }
        IMstStadiumTypeRespository MstStadiumTypeRespository { get; }
        IMstStadiumRespository MstStadiumRespository { get; }
        IMstDistrictRespository MstDistrictRespository { get; }
        Task<int> SaveChangesAsync(); // commit all changes into db
    }
}
