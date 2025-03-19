using API.Data;
using API.Interfaces;
using API.IRespositories; 

namespace API.UnitOfWork
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
        public IMstStadiumStatusRespository MstStadiumStatusRespository { get; }
        public IMstStadiumTypeRespository MstStadiumTypeRespository { get; }
        public IMstStadiumRespository MstStadiumRespository { get; }

        public UnitOfWork
            (
                AppDbContext appDbContext
                ,IMstStadiumStatusRespository mstStadiumStatusRespository
                ,IMstStadiumTypeRespository mstStadiumTypeRespository
                ,IMstStadiumRespository mstStadiumRespository
            )
        {
            _appDbContext = appDbContext;

            MstStadiumStatusRespository = mstStadiumStatusRespository;
            MstStadiumTypeRespository = mstStadiumTypeRespository;
            MstStadiumRespository = mstStadiumRespository;
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
