ALTER TABLE "Chat" ADD COLUMN "IsDeleted" boolean NOT NULL DEFAULT false;
ALTER TABLE "Chat" ADD COLUMN "DeletedAt" timestamp with time zone NULL;
ALTER TABLE "Chat" ADD COLUMN "DeletedBy" text NULL;

INSERT INTO "SysPermission" (
    "PermissionCode", "PermissionNameVi", "PermissionNameEn", "Module", "ModuleNameVi", "ModuleNameEn",
    "DescriptionVi", "DescriptionEn", "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'chat.delete', 'Xóa tin nhắn', 'Delete chat messages', 'chat', 'Nhắn tin', 'Chat',
    'Xóa mềm tin nhắn trong phòng chat; chỉ vai trò Admin được thực hiện',
    'Soft delete shared room messages; restricted to the Admin role',
    4, true, 'system', 'system', now(), now()
)
ON CONFLICT ("PermissionCode") DO NOTHING;
