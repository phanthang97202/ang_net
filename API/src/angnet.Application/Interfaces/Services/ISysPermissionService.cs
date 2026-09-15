using angnet.Domain.Dtos;
using angnet.Domain.Models;

namespace angnet.Application.Interfaces.Services
{
    public interface ISysPermissionService
    {
        /// <summary>Danh mục quyền của hệ thống, đã gom nhóm theo module.</summary>
        Task<ApiResponse<PermissionModuleDto>> GetCatalogue();

        /// <summary>Các mã quyền đang gán cho một vai trò.</summary>
        Task<ApiResponse<RolePermissionDto>> GetPermissionsOfRole(string roleId);

        /// <summary>Thay toàn bộ quyền của một vai trò bằng danh sách mới.</summary>
        Task<ApiResponse<RolePermissionDto>> UpdatePermissionsOfRole(RolePermissionUpdateDto data);
    }
}
