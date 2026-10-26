-- Module nghe nhac Audius. API Audius la nguon public, con quyen nay kiem soat
-- viec hien menu va truy cap module trong blog. Admin van co toan quyen theo co
-- che hien tai; cac tai khoan khac duoc gan music.use tu man quan ly vai tro.
INSERT INTO "SysPermission" (
    "PermissionCode", "PermissionNameVi", "PermissionNameEn",
    "Module", "ModuleNameVi", "ModuleNameEn",
    "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'music.use', 'Sử dụng trình phát nhạc', 'Use music player',
    'music', 'Âm nhạc', 'Music',
    'Mở module âm nhạc, xem danh sách và phát nhạc từ Audius',
    'Open the music module, browse tracks and stream music from Audius',
    1, true, 'system', 'system', now(), now()
) ON CONFLICT ("PermissionCode") DO NOTHING;

INSERT INTO "SysMenu" (
    "MenuId", "ParentId", "TitleVi", "TitleEn", "Path", "Icon",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'music', NULL, 'Âm nhạc', 'Music', '/music', 'customer-service',
    7, true, 'system', 'system', now(), now()
) ON CONFLICT ("MenuId") DO UPDATE SET
    "TitleVi" = EXCLUDED."TitleVi",
    "TitleEn" = EXCLUDED."TitleEn",
    "Path" = EXCLUDED."Path",
    "Icon" = EXCLUDED."Icon",
    "SortOrder" = EXCLUDED."SortOrder",
    "FlagActive" = EXCLUDED."FlagActive",
    "UpdatedBy" = 'system',
    "UpdatedDTime" = now();
