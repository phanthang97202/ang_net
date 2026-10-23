CREATE TABLE "AnalyticsEvent" (
    "EventId" varchar(64) PRIMARY KEY,
    "OccurredAt" timestamptz NOT NULL,
    "LocalHour" varchar(13) NOT NULL,
    "SessionId" varchar(36) NOT NULL,
    "Kind" varchar(12) NOT NULL,
    "ContentId" varchar(200) NOT NULL,
    "Title" varchar(500) NOT NULL,
    "Path" varchar(500) NOT NULL
);
CREATE INDEX "IX_AnalyticsEvent_OccurredAt_Kind" ON "AnalyticsEvent" ("OccurredAt", "Kind");
CREATE INDEX "IX_AnalyticsEvent_Kind_ContentId_OccurredAt" ON "AnalyticsEvent" ("Kind", "ContentId", "OccurredAt");
CREATE TABLE "AnalyticsPresence" ("SessionId" varchar(36) PRIMARY KEY, "LastSeenAt" timestamptz NOT NULL);
CREATE INDEX "IX_AnalyticsPresence_LastSeenAt" ON "AnalyticsPresence" ("LastSeenAt");
CREATE TABLE "AnalyticsCollection" ("Id" integer PRIMARY KEY, "StartedAt" timestamptz NOT NULL);
INSERT INTO "AnalyticsCollection" VALUES (1, now());
INSERT INTO "SysPermission" (
    "PermissionCode", "PermissionNameVi", "PermissionNameEn", "Module", "ModuleNameVi", "ModuleNameEn",
    "DescriptionVi", "DescriptionEn", "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES ('analytics.view', 'Xem thống kê truy cập', 'View web analytics', 'analytics', 'Thống kê truy cập', 'Web analytics',
    'Xem biểu đồ truy cập và nội dung được quan tâm', 'View traffic trends and popular content',
    1, true, 'system', 'system', now(), now());
