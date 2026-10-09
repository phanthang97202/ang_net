INSERT INTO "SysPermission" (
    "PermissionCode", "PermissionNameVi", "PermissionNameEn", "Module", "ModuleNameVi", "ModuleNameEn",
    "DescriptionVi", "DescriptionEn", "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES
    ('reel.upload_image', 'Tải ảnh từ thiết bị', 'Upload reel images', 'reel', 'Reels', 'Reels',
     'Cho phép tải ảnh từ thiết bị lên Cloudinary; lưu link ảnh không cần quyền này',
     'Upload device images to Cloudinary; external image URLs do not need this permission',
     1, true, 'system', 'system', now(), now()),
    ('reel.upload_video', 'Tải video từ thiết bị', 'Upload reel videos', 'reel', 'Reels', 'Reels',
     'Cho phép tải video từ thiết bị lên Cloudinary; lưu link video không cần quyền này',
     'Upload device videos to Cloudinary; external video URLs do not need this permission',
     2, true, 'system', 'system', now(), now()),
    ('archive.upload', 'Tải ảnh / video từ thiết bị', 'Upload archive media', 'archive', 'Thư viện lưu trữ', 'Personal archive',
     'Tải ảnh và video từ thiết bị lên Cloudinary; cần có archive.use. Lưu link không cần quyền này',
     'Upload device images and videos to Cloudinary; also requires archive.use. External links do not need this permission',
     2, true, 'system', 'system', now(), now())
ON CONFLICT ("PermissionCode") DO NOTHING;
