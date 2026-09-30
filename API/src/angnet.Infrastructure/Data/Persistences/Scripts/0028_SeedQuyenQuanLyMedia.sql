-- Phan quyen rieng cho thu vien media. Admin tu dong co tat ca quyen qua PermissionHandler.
INSERT INTO "SysPermission" (
    "PermissionCode", "PermissionNameVi", "PermissionNameEn",
    "Module", "ModuleNameVi", "ModuleNameEn",
    "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES
    ('media.view', 'Xem thu vien media', 'View media library',
     'media', 'Thu vien media', 'Media library',
     'Xem va tim kiem file tren Cloudinary', 'View and search Cloudinary assets',
     1, true, 'system', 'system', now(), now()),
    ('media.upload', 'Tai file len', 'Upload media',
     'media', 'Thu vien media', 'Media library',
     'Tai file moi len Cloudinary', 'Upload new files to Cloudinary',
     2, true, 'system', 'system', now(), now()),
    ('media.delete', 'Xoa file', 'Delete media',
     'media', 'Thu vien media', 'Media library',
     'Xoa file khong con duoc su dung', 'Delete media that is no longer in use',
     3, true, 'system', 'system', now(), now());
