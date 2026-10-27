CREATE TABLE "MusicAnalyticsEvent" (
  "EventId" varchar(36) PRIMARY KEY,
  "OccurredAt" timestamptz NOT NULL,
  "Kind" varchar(20) NOT NULL,
  "Provider" varchar(10) NOT NULL,
  "UserId" varchar(450),
  "TrackId" varchar(200) NOT NULL,
  "Title" varchar(500) NOT NULL,
  "Keyword" varchar(200) NOT NULL,
  "CollectionId" varchar(36) NOT NULL
);
CREATE INDEX "IX_MusicAnalyticsEvent_OccurredAt" ON "MusicAnalyticsEvent" ("OccurredAt");
INSERT INTO "SysPermission" (
  "PermissionCode", "PermissionNameVi", "PermissionNameEn", "Module", "ModuleNameVi", "ModuleNameEn",
  "DescriptionVi", "DescriptionEn", "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES ('music.analytics.view', 'Xem thống kê âm nhạc', 'View music analytics', 'music', 'Âm nhạc', 'Music',
  'Xem thống kê sử dụng và nhật ký âm nhạc', 'View music usage statistics and activity', 2, true, 'system', 'system', now(), now())
ON CONFLICT ("PermissionCode") DO NOTHING;
