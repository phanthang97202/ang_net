-- Catalogue only: access must be assigned explicitly through role permissions.
-- Admin retains the existing PermissionHandler bypass. Ownership still applies.
INSERT INTO "SysPermission" (
    "PermissionCode", "PermissionNameVi", "PermissionNameEn",
    "Module", "ModuleNameVi", "ModuleNameEn",
    "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'personalnote.use', 'Sử dụng ghi chú cá nhân', 'Use personal notes',
    'personalnote', 'Ghi chú cá nhân', 'Personal notes',
    'Xem, tạo, sửa và xóa ghi chú riêng của chính mình',
    'View, create, edit and delete your own private notes',
    1, true, 'system', 'system', now(), now()
);
