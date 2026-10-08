-- Quyen xem doanh thu doc lap voi quyen CRUD bao cao ca.
-- Khong tu dong cap quyen cho vai tro/tai khoan hien co.
INSERT INTO "SysPermission" (
    "PermissionCode", "PermissionNameVi", "PermissionNameEn",
    "Module", "ModuleNameVi", "ModuleNameEn",
    "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'revenuereport.view', 'Xem báo cáo doanh thu', 'View revenue reports',
    'revenuereport', 'Báo cáo doanh thu', 'Revenue reports',
    'Xem, lọc và in báo cáo tổng hợp doanh thu',
    'View, filter and print revenue reports',
    1, true, 'system', 'system', now(), now()
) ON CONFLICT ("PermissionCode") DO NOTHING;
