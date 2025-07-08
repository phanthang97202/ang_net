using API.Application.Interfaces.Repositories;
using SharedModels.Models;

namespace API.Infrastructure.Data.Repositories
{
    public class AuditTrailRespository : BaseRepository<AuditTrailModel>, IAuditTrailRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        public AuditTrailRespository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor) : base(appDbContext, httpContextAccessor)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
        }
    }
}
