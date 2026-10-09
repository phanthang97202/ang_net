INSERT INTO "SysPermission" (
    "PermissionCode", "PermissionNameVi", "PermissionNameEn", "Module", "ModuleNameVi", "ModuleNameEn",
    "DescriptionVi", "DescriptionEn", "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'chat.send_image', 'Gửi ảnh', 'Send chat images', 'chat', 'Nhắn tin', 'Chat',
    'Tải lên và gửi ảnh trong phòng chat; cần có quyền xem và gửi tin nhắn',
    'Upload and send chat images; also requires chat view and send permissions',
    3, true, 'system', 'system', now(), now()
)
ON CONFLICT ("PermissionCode") DO NOTHING;
