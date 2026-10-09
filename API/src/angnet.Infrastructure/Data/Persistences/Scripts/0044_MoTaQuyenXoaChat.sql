UPDATE "SysPermission"
SET "DescriptionVi" = 'Xóa mềm tin nhắn trong phòng chat; cần quyền chat.view và chat.delete',
    "DescriptionEn" = 'Soft delete shared room messages; requires chat.view and chat.delete',
    "UpdatedBy" = 'system', "UpdatedDTime" = now()
WHERE "PermissionCode" = 'chat.delete';
