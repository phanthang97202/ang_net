using angnet.Domain.Models;

namespace angnet.Application.Interfaces.Repositories
{
    public interface ISysPermissionRespository : IBaseRespository<SysPermissionModel>
    {
        /// <summary>
        /// Toàn bộ danh mục quyền đang hiệu lực, đã sắp theo nhóm rồi tới thứ tự trong nhóm.
        /// </summary>
        Task<List<SysPermissionModel>> GetAllActiveOrdered();

        /// <summary>
        /// Các mã quyền đang gán cho một vai trò (đọc từ AspNetRoleClaims).
        /// </summary>
        Task<List<string>> GetPermissionsOfRole(string roleId);

        /// <summary>
        /// Thay toàn bộ quyền của một vai trò bằng danh sách mới.
        /// </summary>
        Task ReplacePermissionsOfRole(string roleId, List<string> permissionCodes);
    }
}
