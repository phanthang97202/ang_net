using angnet.Application.Interfaces.Repositories;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace angnet.Infrastructure.Data.Repositories
{
    public class SysPermissionRespository : BaseRepository<SysPermissionModel>, ISysPermissionRespository
    {
        // Tên claim chứa mã quyền trong bảng AspNetRoleClaims. Phải khớp với hằng số
        // cùng tên ở PermissionHandler và AccountRespository.
        private const string PermissionClaimType = "permission";

        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;

        public SysPermissionRespository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor)
            : base(appDbContext, httpContextAccessor)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<List<SysPermissionModel>> GetAllActiveOrdered()
        {
            return await _dbContext.SysPermission
                                   .AsNoTracking()
                                   .Where(p => p.FlagActive)
                                   .OrderBy(p => p.Module)
                                   .ThenBy(p => p.SortOrder)
                                   .ThenBy(p => p.PermissionCode)
                                   .ToListAsync();
        }

        public async Task<List<string>> GetPermissionsOfRole(string roleId)
        {
            return await _dbContext.RoleClaims
                                   .AsNoTracking()
                                   .Where(rc => rc.RoleId == roleId
                                                && rc.ClaimType == PermissionClaimType
                                                && rc.ClaimValue != null)
                                   .Select(rc => rc.ClaimValue!)
                                   .ToListAsync();
        }

        public async Task ReplacePermissionsOfRole(string roleId, List<string> permissionCodes)
        {
            // Xoá hết rồi thêm lại thay vì tính phần chênh: danh sách quyền của một vai
            // trò chỉ vài chục dòng, làm vậy đơn giản hơn và không sót trường hợp nào.
            // CHỈ xoá claim loại "permission" - vai trò có thể mang claim khác cho mục
            // đích khác, xoá sạch là mất luôn những claim đó.
            List<IdentityRoleClaim<string>> existing = await _dbContext.RoleClaims
                                    .Where(rc => rc.RoleId == roleId && rc.ClaimType == PermissionClaimType)
                                    .ToListAsync();

            _dbContext.RoleClaims.RemoveRange(existing);

            foreach (string code in permissionCodes.Distinct())
            {
                _dbContext.RoleClaims.Add(new IdentityRoleClaim<string>
                {
                    RoleId = roleId,
                    ClaimType = PermissionClaimType,
                    ClaimValue = code
                });
            }
        }
    }
}
