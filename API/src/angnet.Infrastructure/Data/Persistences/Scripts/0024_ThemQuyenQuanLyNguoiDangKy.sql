-- Quyen rieng cho man hinh quan ly nguoi dang ky nhan bai viet.
-- Tach khoi sysparameter de viec cap quyen tham so he thong khong tu dong cho
-- phep xem email hay bat/tat viec gui thu cua nguoi dang ky.
INSERT INTO "SysPermission" (
    "PermissionCode", "PermissionNameVi", "PermissionNameEn",
    "Module", "ModuleNameVi", "ModuleNameEn",
    "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES
    ('subscriber.view', 'Xem nguoi dang ky', 'View subscribers',
     'subscriber', 'Nguoi dang ky', 'Subscribers',
     'Xem danh sach email dang ky nhan bai viet', 'View the post subscription email list',
     1, true, 'system', 'system', now(), now()),
    ('subscriber.update', 'Cap nhat nguoi dang ky', 'Update subscribers',
     'subscriber', 'Nguoi dang ky', 'Subscribers',
     'Bat hoac tam ngung gui bai moi cho nguoi dang ky', 'Enable or temporarily stop post emails for a subscriber',
     2, true, 'system', 'system', now(), now())
ON CONFLICT ("PermissionCode") DO NOTHING;

-- Giu nguyen quyen truy cap hien co: truoc script nay, man hinh nguoi dang ky gac
-- bang sysparameter.view. Doi sang subscriber.view ma khong cap lai thi moi vai tro
-- (khong phai Admin) dang vao duoc man hinh nay se bi day ra ngay sau khi deploy.
--
-- CHI cap subscriber.view. subscriber.update la thao tac moi (bat/tat nguoi nhan),
-- truoc day chua ai lam duoc, nen phai do Admin chu dong cap - khong tu dong mo
-- rong quyen cho ai.
INSERT INTO "AspNetRoleClaims" ("RoleId", "ClaimType", "ClaimValue")
SELECT rc."RoleId", 'permission', 'subscriber.view'
FROM "AspNetRoleClaims" rc
WHERE rc."ClaimType" = 'permission'
  AND rc."ClaimValue" = 'sysparameter.view'
  AND NOT EXISTS (
      SELECT 1 FROM "AspNetRoleClaims" x
      WHERE x."RoleId" = rc."RoleId"
        AND x."ClaimType" = 'permission'
        AND x."ClaimValue" = 'subscriber.view'
  );
