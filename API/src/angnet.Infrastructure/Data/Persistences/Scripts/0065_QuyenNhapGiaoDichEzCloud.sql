-- Quyen rieng cho chuc nang "Lay tu ezCloud" trong bao cao ca: chuc nang nay goi
-- thang he thong PMS bang access token cua khach san nen khong cap kem quyen
-- tao/sua. Khong tu dong cap cho vai tro nao; Admin van duoc bo qua kiem tra quyen.
-- Module va ten module phai trung dung 0012 de hien chung nhom "Bao cao ca".
INSERT INTO "SysPermission" (
    "PermissionCode", "PermissionNameVi", "PermissionNameEn",
    "Module", "ModuleNameVi", "ModuleNameEn",
    "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'shiftreport.import_ezcloud', 'Nhập giao dịch từ ezCloud', 'Import transactions from ezCloud',
    'shiftreport', 'Bao cao ca', 'Shift reports',
    'Lấy khoản thu/chi của ca từ ezCloud để điền vào báo cáo (cần thêm quyền tạo hoặc sửa báo cáo)',
    'Pull shift payments from ezCloud into a report (also needs create or update)',
    5, true, 'system', 'system', now(), now()
) ON CONFLICT ("PermissionCode") DO NOTHING;
