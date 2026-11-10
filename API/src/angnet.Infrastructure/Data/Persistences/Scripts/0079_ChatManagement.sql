INSERT INTO "SysPermission" (
  "PermissionCode", "PermissionNameVi", "PermissionNameEn", "Module", "ModuleNameVi", "ModuleNameEn",
  "DescriptionVi", "DescriptionEn", "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
  'chat.manage', 'Quản lý tin nhắn', 'Manage chat messages', 'chat', 'Nhắn tin', 'Chat',
  'Xem và tìm kiếm toàn bộ tin nhắn trong trang quản trị; cần thêm quyền chat.view',
  'View and search all messages in the admin dashboard; also requires chat.view',
  5, true, 'system', 'system', now(), now()
)
ON CONFLICT ("PermissionCode") DO NOTHING;
