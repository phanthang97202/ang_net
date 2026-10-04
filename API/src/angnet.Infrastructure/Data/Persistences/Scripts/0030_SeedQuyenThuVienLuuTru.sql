-- Quyen dung module Thu vien luu tru. Day chi la quyen "duoc dung tinh nang":
-- co quyen nay thi tao/sua bo suu tap CUA CHINH MINH. Viec ai sua duoc bo nao
-- do OwnerId quyet dinh trong ArchiveService, khong phai permission.
-- Admin tu dong co quyen nay qua PermissionHandler.
INSERT INTO "SysPermission" (
    "PermissionCode", "PermissionNameVi", "PermissionNameEn",
    "Module", "ModuleNameVi", "ModuleNameEn",
    "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES
    ('archive.use', 'Dung thu vien luu tru', 'Use personal archive',
     'archive', 'Thu vien luu tru', 'Personal archive',
     'Tao bo suu tap, tai anh/video va luu link ngoai vao thu vien cua chinh minh',
     'Create collections, upload photos/videos and save external links to your own archive',
     1, true, 'system', 'system', now(), now());
