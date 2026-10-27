CREATE TABLE "PersonalCalendarEvent" (
  "EventId" varchar(36) NOT NULL PRIMARY KEY,
  "OwnerId" text NOT NULL REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
  "Title" varchar(120) NOT NULL,
  "StartDate" date NOT NULL,
  "EndDate" date NOT NULL,
  "StartTime" varchar(5) NOT NULL,
  "EndTime" varchar(5) NOT NULL,
  "AllDay" boolean NOT NULL,
  "Category" varchar(16) NOT NULL,
  "Location" varchar(200) NOT NULL,
  "Notes" varchar(1000) NOT NULL,
  "Version" integer NOT NULL,
  "CreatedAt" timestamptz NOT NULL,
  "UpdatedAt" timestamptz NOT NULL
);
CREATE INDEX "IX_PersonalCalendarEvent_OwnerId_StartDate_EndDate" ON "PersonalCalendarEvent" ("OwnerId", "StartDate", "EndDate");

INSERT INTO "SysPermission" ("PermissionCode", "PermissionNameVi", "PermissionNameEn", "Module", "ModuleNameVi", "ModuleNameEn", "DescriptionVi", "DescriptionEn", "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime")
VALUES ('calendar.use', 'Sử dụng lịch cá nhân', 'Use personal calendar', 'calendar', 'Lịch cá nhân', 'Personal calendar', 'Xem và quản lý sự kiện cá nhân của chính mình', 'View and manage your own personal events', 1, true, 'system', 'system', now(), now())
ON CONFLICT ("PermissionCode") DO NOTHING;

INSERT INTO "SysMenu" ("MenuId", "ParentId", "TitleVi", "TitleEn", "Path", "Icon", "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime")
VALUES ('personal-calendar', NULL, 'Lịch cá nhân', 'Personal calendar', '/calendar', 'calendar', 8, true, 'system', 'system', now(), now())
ON CONFLICT ("MenuId") DO NOTHING;
