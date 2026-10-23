-- Additive migration: old clients can finish requests during a rolling deployment.
-- AnalyticsEvent remains the website event store; new film writes use MovieViewLog.
ALTER TABLE "AnalyticsCollection" ADD COLUMN "UnifiedAt" timestamptz;
ALTER TABLE "AnalyticsCollection" ADD COLUMN "LegacyCapturedAt" timestamptz;
ALTER TABLE "AnalyticsCollection" ADD COLUMN "MovieImportedAt" timestamptz;
ALTER TABLE "AnalyticsCollection" ADD COLUMN "MovieHistoryStartedAt" timestamptz;
UPDATE "AnalyticsCollection" SET "UnifiedAt" = now() WHERE "Id" = 1;

CREATE TABLE "WebsiteSession" (
    "SessionId" varchar(36) PRIMARY KEY, "VisitorId" varchar(80) NOT NULL,
    "StartedAt" timestamptz NOT NULL, "StartedLocalHour" varchar(13) NOT NULL, "LastSeenAt" timestamptz NOT NULL,
    "LastActivityAt" timestamptz NOT NULL, "IsCurrent" boolean NOT NULL, "Source" varchar(16) NOT NULL
);
CREATE INDEX "IX_WebsiteSession_StartedAt" ON "WebsiteSession" ("StartedAt");
CREATE INDEX "IX_WebsiteSession_LastSeenAt" ON "WebsiteSession" ("LastSeenAt");
CREATE UNIQUE INDEX "IX_WebsiteSession_CurrentVisitor" ON "WebsiteSession" ("VisitorId") WHERE "IsCurrent";
INSERT INTO "WebsiteSession"
SELECT "SessionId", 'v1:' || "SessionId", min("OccurredAt"), to_char(min("OccurredAt") AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD"T"HH24'), max("OccurredAt"), max("OccurredAt"), true, 'v1'
FROM "AnalyticsEvent" WHERE "Kind" = 'page' GROUP BY "SessionId";

CREATE TABLE "MovieViewLog" (
    "EventId" varchar(64) PRIMARY KEY, "OccurredAt" timestamptz NOT NULL, "LocalHour" varchar(13) NOT NULL,
    "SessionId" varchar(36), "UserId" varchar(450), "ActorName" varchar(256) NOT NULL,
    "MovieSlug" varchar(200) NOT NULL, "MovieTitle" varchar(500) NOT NULL,
    "ServerId" integer, "ServerName" varchar(200), "EpisodeSlug" varchar(200), "EpisodeName" varchar(200),
    "Source" varchar(24) NOT NULL, "LegacyAuditTrailId" integer
);
CREATE INDEX "IX_MovieViewLog_OccurredAt" ON "MovieViewLog" ("OccurredAt");
CREATE INDEX "IX_MovieViewLog_MovieSlug_OccurredAt" ON "MovieViewLog" ("MovieSlug", "OccurredAt");
CREATE INDEX "IX_MovieViewLog_UserId_OccurredAt" ON "MovieViewLog" ("UserId", "OccurredAt");
CREATE UNIQUE INDEX "IX_MovieViewLog_LegacyAuditTrailId" ON "MovieViewLog" ("LegacyAuditTrailId") WHERE "LegacyAuditTrailId" IS NOT NULL;
INSERT INTO "MovieViewLog" ("EventId", "OccurredAt", "LocalHour", "SessionId", "ActorName", "MovieSlug", "MovieTitle", "Source")
SELECT "EventId", "OccurredAt", "LocalHour", "SessionId", '', "ContentId", "Title", 'analytics-v1'
FROM "AnalyticsEvent" WHERE "Kind" = 'movie' ON CONFLICT DO NOTHING;
UPDATE "AnalyticsCollection" SET "MovieHistoryStartedAt" = "StartedAt" WHERE "Id" = 1;

CREATE TABLE "AnalyticsLegacySnapshot" (
    "SnapshotId" varchar(250) PRIMARY KEY, "Kind" varchar(20) NOT NULL, "ContentId" text NOT NULL,
    "Title" varchar(500) NOT NULL, "Source" varchar(32) NOT NULL, "Period" varchar(7) NOT NULL,
    "Value" bigint NOT NULL, "CapturedAt" timestamptz NOT NULL, "CanMerge" boolean NOT NULL
);
-- Preserve historical counters for inspection, never distribute a total over invented days.
INSERT INTO "AnalyticsLegacySnapshot"
SELECT 'article:' || md5("NewsId"), 'article', "NewsId", left("ShortTitle", 500), 'News.ViewCount', '', "ViewCount", now(), false FROM "News";
INSERT INTO "AnalyticsLegacySnapshot"
SELECT 'reel:' || md5("ReelId"), 'reel', "ReelId", left("Caption", 500), 'Reel.ViewCount', '', "ViewCount", now(), false FROM "Reel";

INSERT INTO "SysPermission" ("PermissionCode", "PermissionNameVi", "PermissionNameEn", "Module", "ModuleNameVi", "ModuleNameEn",
    "DescriptionVi", "DescriptionEn", "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime") VALUES
('movieviewlog.view', 'Xem nhật ký mở phim', 'View movie viewing logs', 'analytics', 'Thống kê truy cập', 'Web analytics',
 'Xem tài khoản, phim, tập và thời điểm mở trình phát', 'View who opened a film episode and when', 2, true, 'system', 'system', now(), now()),
('analytics.import', 'Đối soát và nhập thống kê cũ', 'Reconcile and import legacy analytics', 'analytics', 'Thống kê truy cập', 'Web analytics',
 'Kiểm tra nguồn và nhập dữ liệu thống kê lịch sử một lần, chống trùng', 'Review and import historical analytics idempotently', 3, true, 'system', 'system', now(), now());
