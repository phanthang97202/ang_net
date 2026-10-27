CREATE TABLE "PersonalExpense" (
  "Id" varchar(36) PRIMARY KEY, "OwnerId" text NOT NULL REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
  "Type" varchar(8) NOT NULL, "Amount" bigint NOT NULL, "Date" date NOT NULL,
  "Category" varchar(80) NOT NULL, "Note" varchar(500) NOT NULL, "Version" integer NOT NULL,
  "CreatedAt" timestamptz NOT NULL, "UpdatedAt" timestamptz NOT NULL
);
CREATE INDEX "IX_PersonalExpense_OwnerId_Date" ON "PersonalExpense" ("OwnerId", "Date");
CREATE TABLE "PersonalExpenseCategory" (
  "Id" varchar(36) PRIMARY KEY, "OwnerId" text NOT NULL REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
  "Name" varchar(80) NOT NULL, "NormalizedName" varchar(80) NOT NULL
);
CREATE UNIQUE INDEX "IX_PersonalExpenseCategory_OwnerId_NormalizedName" ON "PersonalExpenseCategory" ("OwnerId", "NormalizedName");
INSERT INTO "SysPermission" ("PermissionCode", "PermissionNameVi", "PermissionNameEn", "Module", "ModuleNameVi", "ModuleNameEn", "DescriptionVi", "DescriptionEn", "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime")
VALUES ('expenses.use', 'Sử dụng thu chi cá nhân', 'Use personal finances', 'expenses', 'Thu chi cá nhân', 'Personal finances', 'Quản lý thu chi cá nhân của chính mình', 'Manage your own income and expenses', 1, true, 'system', 'system', now(), now())
ON CONFLICT ("PermissionCode") DO NOTHING;
INSERT INTO "SysMenu" ("MenuId", "ParentId", "TitleVi", "TitleEn", "Path", "Icon", "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime")
VALUES ('personal-expenses', NULL, 'Thu chi cá nhân', 'Personal finances', '/expenses', 'wallet', 9, true, 'system', 'system', now(), now())
ON CONFLICT ("MenuId") DO NOTHING;
