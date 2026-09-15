using angnet.Application.Interfaces.Repositories;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace angnet.Infrastructure.Data.Repositories
{
    public class SysMenuRespository : BaseRepository<SysMenuModel>, ISysMenuRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;

        public SysMenuRespository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor)
            : base(appDbContext, httpContextAccessor)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<List<SysMenuModel>> GetAllOrdered()
        {
            return await OrderedQuery(_dbContext.SysMenu.AsNoTracking()).ToListAsync();
        }

        public async Task<List<SysMenuModel>> GetActiveOrdered()
        {
            return await OrderedQuery(
                _dbContext.SysMenu.AsNoTracking().Where(m => m.FlagActive)
            ).ToListAsync();
        }

        public async Task<int> CountChildren(string menuId)
        {
            return await _dbContext.SysMenu.AsNoTracking()
                                   .CountAsync(m => m.ParentId == menuId);
        }

        // Menu cha trước rồi mới tới con, trong mỗi cấp sắp theo SortOrder. Thêm
        // MenuId làm khoá phụ để hai menu cùng SortOrder không đảo chỗ giữa các
        // lần gọi - navbar mà nhảy thứ tự thì rất khó chịu.
        private static IQueryable<SysMenuModel> OrderedQuery(IQueryable<SysMenuModel> query)
        {
            return query.OrderBy(m => m.ParentId == null ? 0 : 1)
                        .ThenBy(m => m.ParentId)
                        .ThenBy(m => m.SortOrder)
                        .ThenBy(m => m.MenuId);
        }
    }
}
