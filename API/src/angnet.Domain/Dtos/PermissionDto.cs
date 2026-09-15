namespace angnet.Domain.Dtos
{
    /// <summary>Một quyền trong danh mục.</summary>
    public class PermissionItemDto
    {
        public string PermissionCode { get; set; } = string.Empty;
        public string PermissionNameVi { get; set; } = string.Empty;
        public string PermissionNameEn { get; set; } = string.Empty;
        public string DescriptionVi { get; set; } = string.Empty;
        public string DescriptionEn { get; set; } = string.Empty;
        public int SortOrder { get; set; }
    }

    /// <summary>
    /// Danh mục quyền gom theo module - màn hình quản trị vẽ mỗi module thành một
    /// khối checkbox nên trả sẵn dạng đã gom, client khỏi phải tự nhóm lại.
    /// </summary>
    public class PermissionModuleDto
    {
        public string Module { get; set; } = string.Empty;
        public string ModuleNameVi { get; set; } = string.Empty;
        public string ModuleNameEn { get; set; } = string.Empty;
        public List<PermissionItemDto> Permissions { get; set; } = new List<PermissionItemDto>();
    }

    /// <summary>Quyền hiện có của một vai trò.</summary>
    public class RolePermissionDto
    {
        public string RoleId { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
        public List<string> Permissions { get; set; } = new List<string>();
    }

    /// <summary>Yêu cầu thay toàn bộ quyền của một vai trò.</summary>
    public class RolePermissionUpdateDto
    {
        public string RoleId { get; set; } = string.Empty;
        public List<string> Permissions { get; set; } = new List<string>();
    }
}
