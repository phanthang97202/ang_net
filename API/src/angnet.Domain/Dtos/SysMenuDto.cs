namespace angnet.Domain.Dtos
{
    /// <summary>Một mục menu kèm menu con - dạng navbar dùng để vẽ thẳng.</summary>
    public class SysMenuTreeDto
    {
        public string MenuId { get; set; } = string.Empty;
        public string TitleVi { get; set; } = string.Empty;
        public string TitleEn { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public bool FlagActive { get; set; }
        public List<SysMenuTreeDto> Children { get; set; } = new List<SysMenuTreeDto>();
    }

    /// <summary>
    /// Yêu cầu dời một mục menu lên/xuống một bậc.
    ///
    /// Client chỉ nói hướng dời; SortOrder mới của cả nhóm do server tính, vì thứ
    /// tự là của cả cấp chứ không của riêng một dòng.
    /// </summary>
    public class SysMenuReorderDto
    {
        public string MenuId { get; set; } = string.Empty;

        /// <summary>"up" hoặc "down".</summary>
        public string Direction { get; set; } = string.Empty;
    }

    /// <summary>Dữ liệu tạo/sửa một mục menu.</summary>
    public class SysMenuSaveDto
    {
        public string MenuId { get; set; } = string.Empty;
        public string? ParentId { get; set; }
        public string TitleVi { get; set; } = string.Empty;
        public string TitleEn { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public bool FlagActive { get; set; }
    }
}
