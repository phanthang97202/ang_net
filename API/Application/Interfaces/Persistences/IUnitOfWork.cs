using API.Application.Interfaces.Repositories;

namespace API.Application.Interfaces.Persistences
{
    public interface IUnitOfWork : IDisposable
    {
        IMstProvinceRespository MstProvinceRespository { get; }
        IMstStadiumStatusRespository MstStadiumStatusRespository { get; }
        IMstStadiumTypeRespository MstStadiumTypeRespository { get; }
        IMstStadiumRespository MstStadiumRespository { get; }
        IMstDistrictRespository MstDistrictRespository { get; }
        Task<int> SaveChangesAsync(); // commit all changes into db
    }
}
