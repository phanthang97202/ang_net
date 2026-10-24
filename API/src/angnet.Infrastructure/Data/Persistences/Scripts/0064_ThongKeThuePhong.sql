-- Independent reporting permission; existing roles are not granted access.
INSERT INTO "SysPermission" (
    "PermissionCode", "PermissionNameVi", "PermissionNameEn",
    "Module", "ModuleNameVi", "ModuleNameEn", "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'rentalstatistics.view', 'Xem thống kê thuê phòng', 'View room rental statistics',
    'rentalstatistics', 'Thống kê thuê phòng', 'Room rental statistics',
    'Xem thống kê lượt thuê phòng theo ngày, ca và lễ tân',
    'View rental counts by date, shift and receptionist',
    1, true, 'system', 'system', now(), now()
) ON CONFLICT ("PermissionCode") DO NOTHING;

INSERT INTO "SysMenu" (
    "MenuId", "ParentId", "TitleVi", "TitleEn", "Path", "Icon",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
)
SELECT 'tools-rental-statistics', "MenuId", 'Thống kê thuê phòng', 'Room rental statistics',
    '/tools/rental-statistics', 'line-chart', 4, true, 'system', 'system', now(), now()
FROM "SysMenu" WHERE "MenuId" = 'tools'
ON CONFLICT ("MenuId") DO NOTHING;
