-- Danh muc quyen cua he thong.
--
-- Bang nay CHI la danh muc: no liet ke he thong co nhung quyen nao, ten hien thi
-- ra sao, thuoc nhom nao. Viec GAN quyen vao vai tro KHONG luu o day ma luu o
-- bang "AspNetRoleClaims" co san cua ASP.NET Identity, voi ClaimType='permission'
-- va ClaimValue = PermissionCode ben duoi. Lam vay thi khong phai tu dung lai
-- quan he vai tro-quyen ma Identity da co, va doc ra duoc bang UserManager/
-- RoleManager tieu chuan.
--
-- PermissionCode dat theo dang "module.action" (blog.create, audittrail.view...).
-- Day la khoa bat bien: doi code se lam mat het quyen da gan trong AspNetRoleClaims
-- vi ben do luu chuoi chu khong phai khoa ngoai.
--
-- Module dung de gom nhom tren man hinh quan tri (mot nhom = mot khoi checkbox).
CREATE TABLE "SysPermission" (
    "PermissionCode" text NOT NULL,
    "PermissionNameVi" text NOT NULL,
    "PermissionNameEn" text NOT NULL,
    "Module" text NOT NULL,
    "ModuleNameVi" text NOT NULL,
    "ModuleNameEn" text NOT NULL,
    "DescriptionVi" text NOT NULL,
    "DescriptionEn" text NOT NULL,
    "SortOrder" integer NOT NULL,
    "FlagActive" boolean NOT NULL,
    "CreatedBy" text NOT NULL,
    "UpdatedBy" text NOT NULL,
    "CreatedDTime" timestamp with time zone NOT NULL,
    "UpdatedDTime" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_SysPermission" PRIMARY KEY ("PermissionCode")
);

-- Man hinh quan tri luon doc theo nhom roi den thu tu trong nhom
CREATE INDEX "IX_SysPermission_Module_SortOrder" ON "SysPermission" ("Module", "SortOrder");
