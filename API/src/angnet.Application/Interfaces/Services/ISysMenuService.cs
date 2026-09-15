using angnet.Domain.Dtos;

namespace angnet.Application.Interfaces.Services
{
    public interface ISysMenuService
    {
        /// <summary>Menu đang bật, dạng cây - cho navbar ngoài trang chủ (công khai).</summary>
        Task<ApiResponse<SysMenuTreeDto>> GetActiveTree();

        /// <summary>Toàn bộ menu kể cả đang tắt, dạng cây - cho màn quản trị.</summary>
        Task<ApiResponse<SysMenuTreeDto>> GetAllTree();

        Task<ApiResponse<SysMenuSaveDto>> Create(SysMenuSaveDto data);
        Task<ApiResponse<SysMenuSaveDto>> Update(SysMenuSaveDto data);
        Task<ApiResponse<SysMenuSaveDto>> Delete(string menuId);

        /// <summary>Bật/tắt nhanh một mục menu.</summary>
        Task<ApiResponse<SysMenuSaveDto>> ToggleActive(string menuId, bool flagActive);
    }
}
