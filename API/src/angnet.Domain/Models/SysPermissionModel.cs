using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models
{
    /// <summary>
    /// Danh muc quyen cua he thong. Chi liet ke he thong co nhung quyen nao;
    /// viec gan quyen vao vai tro luu o bang AspNetRoleClaims co san cua Identity
    /// (ClaimType = "permission", ClaimValue = PermissionCode).
    /// </summary>
    public class SysPermissionModel : BaseModel
    {
        [Key]
        [Required]
        public string PermissionCode { get; set; } = string.Empty; // Ma quyen dang "module.action", vd blog.create

        [Required]
        public string PermissionNameVi { get; set; } = string.Empty; // Ten hien thi tieng Viet
        [Required]
        public string PermissionNameEn { get; set; } = string.Empty; // Ten hien thi tieng Anh

        [Required]
        public string Module { get; set; } = string.Empty; // Ma nhom, dung de gom checkbox tren man quan tri
        [Required]
        public string ModuleNameVi { get; set; } = string.Empty; // Ten nhom tieng Viet
        [Required]
        public string ModuleNameEn { get; set; } = string.Empty; // Ten nhom tieng Anh

        public string DescriptionVi { get; set; } = string.Empty; // Mo ta tieng Viet
        public string DescriptionEn { get; set; } = string.Empty; // Mo ta tieng Anh

        public int SortOrder { get; set; } // Thu tu hien thi trong nhom
    }
}
