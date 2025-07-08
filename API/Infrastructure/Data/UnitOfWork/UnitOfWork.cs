using API.Application.Interfaces.Persistences;
using API.Application.Interfaces.Repositories;
using API.Infrastructure.Data;

namespace API.Infrastructure.Data.UnitOfWork
{
    /*
        1. Xây dựng UnitOfWork
            Inject các repository, quản lý transaction, Dispose(), SaveChangesAsync()
    
        2. Xây dựng Repository Layer
            Chỉ tập trung vào thao tác dữ liệu(EF Core, LinQ, Dapper...), không gọi _dbContext.SaveChanges() trực tiếp
    
        3. Xây dựng Service Layer
            Inject IUnitOfWork, xử lý nghiệp vụ, gọi nhiều repository, commit SaveChangesAsync() một lần   
    
        4. Xây dựng Controller Layer
            Inject Service, chỉ gọi các phương thức Service phù hợp
     */
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _appDbContext;
        public IMstProvinceRespository MstProvinceRespository { get; }
        public IMstStadiumStatusRespository MstStadiumStatusRespository { get; }
        public IMstStadiumTypeRespository MstStadiumTypeRespository { get; }
        public IMstStadiumRespository MstStadiumRespository { get; }
        public IMstDistrictRespository MstDistrictRespository { get; }
        public INewsCategoryRespository NewsCategoryRespository { get; }
        public IAuditTrailRespository AuditTrailRespository { get; }

        public UnitOfWork
            (
                AppDbContext appDbContext
                , IMstProvinceRespository mstProvinceRespository
                , IMstStadiumStatusRespository mstStadiumStatusRespository
                , IMstStadiumTypeRespository mstStadiumTypeRespository
                , IMstStadiumRespository mstStadiumRespository
                , IMstDistrictRespository mstDistrictRespository
                , INewsCategoryRespository newsCategoryRespository
                , IAuditTrailRespository auditTrailRespository

            )
        {
            _appDbContext = appDbContext;

            MstProvinceRespository = mstProvinceRespository;
            MstStadiumStatusRespository = mstStadiumStatusRespository;
            MstStadiumTypeRespository = mstStadiumTypeRespository;
            MstStadiumRespository = mstStadiumRespository;
            MstDistrictRespository = mstDistrictRespository;
            NewsCategoryRespository = newsCategoryRespository;
            AuditTrailRespository = auditTrailRespository; 
        }

        // ====================================

        public void Dispose()
        {
            _appDbContext.Dispose(); // giải phóng tài nguyên
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _appDbContext.SaveChangesAsync();
        }
    }
}
