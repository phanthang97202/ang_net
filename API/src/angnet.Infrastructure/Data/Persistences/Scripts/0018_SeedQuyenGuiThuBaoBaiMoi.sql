-- Quyen rieng cho viec gui mail bao bai moi toi nguoi dang ky.
--
-- Truoc do endpoint NotifyNewPost dung tam blog.update. Sai ve nghiep vu: sua
-- bai la thao tac trong noi bo, con gui thu hang loat la hanh dong RA NGOAI,
-- toi hop thu cua nguoi that, va khong thu hoi duoc. Cong tac vien duoc sua bai
-- khong co nghia la duoc phep gui thu cho toan bo nguoi dang ky.
--
-- SortOrder 5: dung sau blog.delete (4) trong cung module blog.
INSERT INTO "SysPermission" (
    "PermissionCode", "PermissionNameVi", "PermissionNameEn",
    "Module", "ModuleNameVi", "ModuleNameEn",
    "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES
    ('blog.noticenews', 'Gui thu bao bai moi', 'Notify subscribers',
     'blog', 'Bai viet', 'Posts',
     'Gui mail bao bai viet moi toi nguoi dang ky nhan tin',
     'Send new post notification email to subscribers',
     5, true, 'system', 'system', now(), now());
