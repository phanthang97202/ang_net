using angnet.Domain.Models;

namespace angnet.Application.Interfaces.Repositories
{
    public interface ISysMenuRespository : IBaseRespository<SysMenuModel>
    {
        /// <summary>
        /// Toàn bộ menu, đã sắp theo cấp rồi tới thứ tự trong cấp.
        /// Dùng cho màn quản trị - lấy cả menu đang tắt.
        /// </summary>
        Task<List<SysMenuModel>> GetAllOrdered();

        /// <summary>
        /// Chỉ menu đang bật, đã sắp thứ tự. Dùng cho navbar ngoài trang chủ.
        /// </summary>
        Task<List<SysMenuModel>> GetActiveOrdered();

        /// <summary>Số menu con đang trỏ vào menu này.</summary>
        Task<int> CountChildren(string menuId);
    }
}
