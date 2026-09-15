-- Danh muc quyen khoi tao, bam theo cac module dang co that trong he thong.
--
-- Vai cho co chu y gop/bo, khong phai thieu sot:
--   - role.manage gop create/update/delete vai tro: tach nho quyen quan tri vai
--     tro gan nhu khong dung den trong thuc te.
--   - master.manage gop tinh + huyen: hai bang danh muc nay hiem khi phan quyen
--     tach roi nhau.
--   - audittrail KHONG co quyen xoa: nhat ky ma xoa duoc thi khong con la nhat ky.
--
-- Quyen o day chua duoc ap dung vao controller nao (cac endpoint van dang dung
-- [Authorize(Roles="Admin")] nhu cu). Buoc nay chi dung nen: co danh muc va co
-- cho gan vao vai tro. Ap dung dan vao tung endpoint la viec sau.
--
-- Vai tro Admin KHONG can duoc gan nhung quyen nay: handler kiem tra quyen se
-- cho Admin di qua truoc khi doc den permission (xem PermissionHandler).
INSERT INTO "SysPermission" (
    "PermissionCode", "PermissionNameVi", "PermissionNameEn",
    "Module", "ModuleNameVi", "ModuleNameEn",
    "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES
    -- Bai viet
    ('blog.view',   'Xem bai viet',  'View posts',   'blog', 'Bai viet', 'Posts', 'Xem danh sach va chi tiet bai viet', 'View post list and detail', 1, true, 'system', 'system', now(), now()),
    ('blog.create', 'Tao bai viet',  'Create post',  'blog', 'Bai viet', 'Posts', 'Tao bai viet moi', 'Create a new post', 2, true, 'system', 'system', now(), now()),
    ('blog.update', 'Sua bai viet',  'Update post',  'blog', 'Bai viet', 'Posts', 'Chinh sua bai viet da co', 'Edit an existing post', 3, true, 'system', 'system', now(), now()),
    ('blog.delete', 'Xoa bai viet',  'Delete post',  'blog', 'Bai viet', 'Posts', 'Xoa bai viet', 'Delete a post', 4, true, 'system', 'system', now(), now()),

    -- Danh muc tin
    ('newscategory.view',   'Xem danh muc tin',  'View categories',  'newscategory', 'Danh muc tin', 'News categories', 'Xem danh sach danh muc tin', 'View news category list', 1, true, 'system', 'system', now(), now()),
    ('newscategory.create', 'Tao danh muc tin',  'Create category',  'newscategory', 'Danh muc tin', 'News categories', 'Tao danh muc tin moi', 'Create a news category', 2, true, 'system', 'system', now(), now()),
    ('newscategory.update', 'Sua danh muc tin',  'Update category',  'newscategory', 'Danh muc tin', 'News categories', 'Chinh sua danh muc tin', 'Edit a news category', 3, true, 'system', 'system', now(), now()),
    ('newscategory.delete', 'Xoa danh muc tin',  'Delete category',  'newscategory', 'Danh muc tin', 'News categories', 'Xoa danh muc tin', 'Delete a news category', 4, true, 'system', 'system', now(), now()),

    -- Nguoi dung
    ('user.view', 'Xem nguoi dung', 'View users', 'user', 'Nguoi dung', 'Users', 'Xem danh sach nguoi dung trong he thong', 'View system user list', 1, true, 'system', 'system', now(), now()),

    -- Vai tro va phan quyen
    ('role.view',   'Xem vai tro',            'View roles',       'role', 'Vai tro', 'Roles', 'Xem danh sach vai tro va quyen cua tung vai tro', 'View roles and their permissions', 1, true, 'system', 'system', now(), now()),
    ('role.manage', 'Quan tri vai tro',       'Manage roles',     'role', 'Vai tro', 'Roles', 'Tao, sua, xoa vai tro va gan quyen cho vai tro', 'Create, edit, delete roles and assign permissions', 2, true, 'system', 'system', now(), now()),
    ('role.assign', 'Gan vai tro cho nguoi dung', 'Assign roles', 'role', 'Vai tro', 'Roles', 'Gan hoac go vai tro cua nguoi dung', 'Assign or remove roles from users', 3, true, 'system', 'system', now(), now()),

    -- Nhat ky he thong (khong co quyen xoa - xem ghi chu dau file)
    ('audittrail.view', 'Xem nhat ky', 'View audit trail', 'audittrail', 'Nhat ky', 'Audit trail', 'Xem nhat ky thao tac cua he thong', 'View system audit trail', 1, true, 'system', 'system', now(), now()),

    -- Tham so he thong
    ('sysparameter.view',   'Xem tham so',  'View parameters',   'sysparameter', 'Tham so he thong', 'System parameters', 'Xem danh sach tham so he thong', 'View system parameter list', 1, true, 'system', 'system', now(), now()),
    ('sysparameter.create', 'Tao tham so',  'Create parameter',  'sysparameter', 'Tham so he thong', 'System parameters', 'Tao tham so he thong moi', 'Create a system parameter', 2, true, 'system', 'system', now(), now()),
    ('sysparameter.update', 'Sua tham so',  'Update parameter',  'sysparameter', 'Tham so he thong', 'System parameters', 'Chinh sua tham so he thong', 'Edit a system parameter', 3, true, 'system', 'system', now(), now()),
    ('sysparameter.delete', 'Xoa tham so',  'Delete parameter',  'sysparameter', 'Tham so he thong', 'System parameters', 'Xoa tham so he thong', 'Delete a system parameter', 4, true, 'system', 'system', now(), now()),

    -- Bao cao ca truc
    ('shiftreport.view',   'Xem bao cao ca',  'View shift reports',  'shiftreport', 'Bao cao ca', 'Shift reports', 'Xem danh sach va chi tiet bao cao ca', 'View shift report list and detail', 1, true, 'system', 'system', now(), now()),
    ('shiftreport.create', 'Tao bao cao ca',  'Create shift report', 'shiftreport', 'Bao cao ca', 'Shift reports', 'Tao bao cao ca truc moi', 'Create a shift report', 2, true, 'system', 'system', now(), now()),
    ('shiftreport.update', 'Sua bao cao ca',  'Update shift report', 'shiftreport', 'Bao cao ca', 'Shift reports', 'Chinh sua bao cao ca truc', 'Edit a shift report', 3, true, 'system', 'system', now(), now()),
    ('shiftreport.delete', 'Xoa bao cao ca',  'Delete shift report', 'shiftreport', 'Bao cao ca', 'Shift reports', 'Xoa bao cao ca truc', 'Delete a shift report', 4, true, 'system', 'system', now(), now()),

    -- Danh muc dia gioi (tinh / huyen)
    ('master.view',   'Xem danh muc dia gioi',     'View master data',   'master', 'Danh muc dia gioi', 'Master data', 'Xem danh muc tinh va huyen', 'View province and district data', 1, true, 'system', 'system', now(), now()),
    ('master.manage', 'Quan tri danh muc dia gioi', 'Manage master data', 'master', 'Danh muc dia gioi', 'Master data', 'Tao, sua, xoa danh muc tinh va huyen', 'Create, edit, delete provinces and districts', 2, true, 'system', 'system', now(), now()),

    -- Reels
    ('reel.view',   'Xem reel',  'View reels',  'reel', 'Reels', 'Reels', 'Xem danh sach reel', 'View reel list', 1, true, 'system', 'system', now(), now()),
    ('reel.create', 'Tao reel',  'Create reel', 'reel', 'Reels', 'Reels', 'Dang reel moi', 'Publish a new reel', 2, true, 'system', 'system', now(), now()),
    ('reel.delete', 'Xoa reel',  'Delete reel', 'reel', 'Reels', 'Reels', 'Xoa reel', 'Delete a reel', 3, true, 'system', 'system', now(), now())
ON CONFLICT ("PermissionCode") DO NOTHING;
