-- Executed in one transaction by DatabaseMigrator. Stop old writers during the
-- snapshot; bridge triggers below capture requests finishing during deployment.
LOCK TABLE "WebsiteSession", "AnalyticsEvent", "MovieViewLog", "News", "Reel", "AnalyticsLegacySnapshot", "AuditTrail" IN SHARE ROW EXCLUSIVE MODE;
ALTER TABLE "AnalyticsCollection" ADD COLUMN IF NOT EXISTS "CanonicalAt" timestamptz;
UPDATE "AnalyticsCollection" SET "CanonicalAt" = COALESCE("CanonicalAt", now()) WHERE "Id" = 1;
CREATE TABLE IF NOT EXISTS "AnalyticsLedger" (
 "EventId" varchar(64) PRIMARY KEY, "Kind" varchar(12) NOT NULL, "RecordType" varchar(12) NOT NULL DEFAULT 'event',
 "Quantity" bigint NOT NULL DEFAULT 1 CHECK ("Quantity" >= 0), "OriginalValue" bigint, "Included" boolean NOT NULL DEFAULT true,
 "OccurredAt" timestamptz NOT NULL, "LocalHour" varchar(13) NOT NULL DEFAULT '', "Period" varchar(7) NOT NULL DEFAULT '',
 "SessionId" varchar(36), "ContentId" varchar(200) NOT NULL DEFAULT '', "Title" varchar(500) NOT NULL DEFAULT '',
 "Path" varchar(500) NOT NULL DEFAULT '', "Source" varchar(32) NOT NULL DEFAULT 'web', "SourceId" varchar(250) NOT NULL DEFAULT '',
 "Note" varchar(300) NOT NULL DEFAULT '', "UserId" varchar(450), "ActorName" varchar(256) NOT NULL DEFAULT '',
 "ServerId" integer, "ServerName" varchar(200), "EpisodeSlug" varchar(200), "EpisodeName" varchar(200), "LegacyAuditTrailId" integer,
 CONSTRAINT "CK_AnalyticsLedger_RecordType" CHECK ("RecordType" IN ('event','balance','excluded')),
 CONSTRAINT "CK_AnalyticsLedger_Kind" CHECK ("Kind" IN ('session','page','article','reel','movie')),
 CONSTRAINT "CK_AnalyticsLedger_EventGrain" CHECK ("RecordType" <> 'event' OR ("Quantity"=1 AND "Period"='')),
 CONSTRAINT "CK_AnalyticsLedger_Excluded" CHECK ("RecordType" <> 'excluded' OR NOT "Included")
);
CREATE INDEX IF NOT EXISTS "IX_AnalyticsLedger_Kind_OccurredAt" ON "AnalyticsLedger" ("Kind", "OccurredAt");
CREATE INDEX IF NOT EXISTS "IX_AnalyticsLedger_Kind_ContentId" ON "AnalyticsLedger" ("Kind", "ContentId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_AnalyticsLedger_LegacyAuditTrailId" ON "AnalyticsLedger" ("LegacyAuditTrailId") WHERE "LegacyAuditTrailId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "IX_AnalyticsLedger_RedisSource" ON "AnalyticsLedger" ("SourceId") WHERE "Source"='Redis.VisitStats' AND "RecordType"='balance';
CREATE TABLE IF NOT EXISTS "AnalyticsGap" ("GapId" varchar(36) PRIMARY KEY, "StartedAt" timestamptz NOT NULL, "EndedAt" timestamptz NOT NULL, "Failures" bigint NOT NULL);

INSERT INTO "AnalyticsLedger" ("EventId", "Kind", "OccurredAt", "LocalHour", "SessionId", "ContentId", "Title", "Path", "Source", "SourceId")
SELECT "EventId", "Kind", "OccurredAt", "LocalHour", "SessionId", "ContentId", "Title", "Path", 'analytics-v1', "EventId" FROM "AnalyticsEvent" ON CONFLICT DO NOTHING;
INSERT INTO "AnalyticsLedger" ("EventId", "Kind", "OccurredAt", "LocalHour", "SessionId", "Source", "SourceId")
SELECT 'session:' || "SessionId", 'session', "StartedAt", "StartedLocalHour", "SessionId", "Source", "SessionId" FROM "WebsiteSession" ON CONFLICT DO NOTHING;
INSERT INTO "AnalyticsLedger" ("EventId", "Kind", "OccurredAt", "LocalHour", "SessionId", "ContentId", "Title", "Path", "Source", "SourceId", "UserId", "ActorName", "ServerId", "ServerName", "EpisodeSlug", "EpisodeName", "LegacyAuditTrailId")
SELECT "EventId", 'movie', "OccurredAt", "LocalHour", "SessionId", "MovieSlug", "MovieTitle", '/phim/' || "MovieSlug", "Source", "EventId", "UserId", "ActorName", "ServerId", "ServerName", "EpisodeSlug", "EpisodeName", "LegacyAuditTrailId" FROM "MovieViewLog"
ON CONFLICT ("EventId") DO UPDATE SET "UserId" = EXCLUDED."UserId", "ActorName" = EXCLUDED."ActorName", "ServerId" = EXCLUDED."ServerId", "ServerName" = EXCLUDED."ServerName", "EpisodeSlug" = EXCLUDED."EpisodeSlug", "EpisodeName" = EXCLUDED."EpisodeName", "LegacyAuditTrailId" = EXCLUDED."LegacyAuditTrailId", "Source" = EXCLUDED."Source";

-- Retain timestamped audit history. Unknown labels stay unknown. Overlap is
-- quarantined, not counted a second time. The original audit ID is unique.
INSERT INTO "AnalyticsLedger" ("EventId", "Kind", "RecordType", "Included", "OccurredAt", "LocalHour", "ContentId", "Title", "Path", "Source", "SourceId", "Note", "ActorName", "LegacyAuditTrailId", "UserId", "EpisodeName", "EpisodeSlug", "ServerName", "ServerId")
SELECT upper(md5('audit:' || a."AuditTrailId") || md5('audit:' || a."AuditTrailId")), 'movie',
 CASE WHEN a."ChangedDTime" < c."StartedAt" AND a."RecordId" ~ '^phimapi:[A-Za-z0-9_-]{1,200}$' AND a."Description" LIKE 'Mở xem phim %' THEN 'event' ELSE 'excluded' END,
 a."ChangedDTime" < c."StartedAt" AND a."RecordId" ~ '^phimapi:[A-Za-z0-9_-]{1,200}$' AND a."Description" LIKE 'Mở xem phim %',
 a."ChangedDTime", to_char(a."ChangedDTime" AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD"T"HH24'),
 CASE WHEN a."RecordId" ~ '^phimapi:[A-Za-z0-9_-]{1,200}$' THEN substring(a."RecordId" from 9) ELSE '' END,
 COALESCE(left(m.parts[1],500),CASE WHEN a."RecordId" ~ '^phimapi:[A-Za-z0-9_-]{1,200}$' THEN substring(a."RecordId" from 9) ELSE '' END),
 CASE WHEN a."RecordId" ~ '^phimapi:[A-Za-z0-9_-]{1,200}$' THEN '/phim/'||substring(a."RecordId" from 9) ELSE '' END, 'audit-legacy', a."AuditTrailId"::text,
 CASE WHEN a."ChangedDTime" >= c."StartedAt" THEN 'Possible overlap with existing events; not added' WHEN a."RecordId" !~ '^phimapi:[A-Za-z0-9_-]{1,200}$' THEN 'Unrecognised film identity' ELSE 'Timestamped history; unknown session metadata is retained; not proof of continuous coverage' END,
 left(COALESCE(a."ChangedBy",''), 256), a."AuditTrailId", left(m.parts[6],450), left(m.parts[2],200), left(m.parts[3],200), left(m.parts[4],200),
 CASE WHEN (m.parts[5])::numeric <= 2147483647 THEN (m.parts[5])::integer ELSE NULL END
FROM "AuditTrail" a CROSS JOIN "AnalyticsCollection" c
LEFT JOIN LATERAL (SELECT regexp_match(a."Description", '^Mở xem phim "(.*)" \([A-Za-z0-9_-]+\) · Tập: (.*?) \(([A-Za-z0-9_-]+)\) · Nguồn: (.*?) \(([0-9]{1,10})\) · UserId: ([A-Za-z0-9_-]+)$') AS parts) m ON true
WHERE c."Id" = 1 AND a."RequestUrl" LIKE '%/Library/%/playback'
 AND NOT EXISTS (SELECT 1 FROM "AnalyticsLedger" l WHERE l."LegacyAuditTrailId" = a."AuditTrailId") ON CONFLICT DO NOTHING;

-- Opening balances reconcile each retained public counter against actual facts.
-- A negative difference is a conflict, never silently clamped into a valid balance.
INSERT INTO "AnalyticsLedger" ("EventId", "Kind", "RecordType", "Quantity", "OriginalValue", "Included", "OccurredAt", "ContentId", "Title", "Source", "SourceId", "Note")
SELECT md5('news:' || n."NewsId") || md5('news:' || n."NewsId"), 'article', 'balance',
 GREATEST(0, COALESCE(n."ViewCount",0) - COALESCE(v.q,0)), n."ViewCount", n."ViewCount" IS NOT NULL AND n."ViewCount" >= COALESCE(v.q,0), now(), left(n."NewsId",200), COALESCE(left(n."ShortTitle",500),''), 'News.ViewCount', n."NewsId",
 CASE WHEN n."ViewCount" IS NULL THEN 'Counter was not recorded; requires reconciliation' WHEN n."ViewCount" < COALESCE(v.q,0) THEN 'Counter is below recorded facts; requires reconciliation' ELSE 'Undated historical balance; excluded from date charts' END
FROM "News" n LEFT JOIN (SELECT "ContentId", sum("Quantity") q FROM "AnalyticsLedger" WHERE "Kind"='article' AND "RecordType"='event' AND "Included" GROUP BY "ContentId") v ON v."ContentId"=n."NewsId" ON CONFLICT DO NOTHING;
INSERT INTO "AnalyticsLedger" ("EventId", "Kind", "RecordType", "Quantity", "OriginalValue", "Included", "OccurredAt", "ContentId", "Title", "Source", "SourceId", "Note")
SELECT md5('reel:' || r."ReelId") || md5('reel:' || r."ReelId"), 'reel', 'balance',
 GREATEST(0, COALESCE(r."ViewCount",0) - COALESCE(v.q,0)), r."ViewCount", r."ViewCount" IS NOT NULL AND r."ViewCount" >= COALESCE(v.q,0), now(), left(r."ReelId",200), COALESCE(left(r."Caption",500),''), 'Reel.ViewCount', r."ReelId",
 CASE WHEN r."ViewCount" IS NULL THEN 'Counter was not recorded; requires reconciliation' WHEN r."ViewCount" < COALESCE(v.q,0) THEN 'Counter is below recorded facts; requires reconciliation' ELSE 'Undated historical balance; excluded from date charts' END
FROM "Reel" r LEFT JOIN (SELECT "ContentId", sum("Quantity") q FROM "AnalyticsLedger" WHERE "Kind"='reel' AND "RecordType"='event' AND "Included" GROUP BY "ContentId") v ON v."ContentId"=r."ReelId" ON CONFLICT DO NOTHING;
INSERT INTO "AnalyticsLedger" ("EventId", "Kind", "RecordType", "Quantity", "OriginalValue", "Included", "OccurredAt", "Period", "Source", "SourceId", "Note")
SELECT md5(s."SnapshotId") || md5(s."SnapshotId"), 'session', 'balance',
 CASE WHEN s."Period"='' AND s."CanMerge" AND s."Value">=v.q THEN s."Value"-v.q ELSE s."Value" END, s."Value",
 s."Period"='' AND s."CanMerge" AND s."Value">=v.q, s."CapturedAt", s."Period", 'Redis.VisitStats', s."SnapshotId",
 CASE WHEN s."Period"<>'' THEN 'UTC-month aggregate; cannot convert to Vietnam daily/monthly facts' WHEN NOT s."CanMerge" THEN 'Overlap is unknown; preserved but not added' WHEN s."Value"<v.q THEN 'Counter is below recorded sessions; requires reconciliation' ELSE 'Inherited tab-based historical balance; not comparable with modern sessions' END
FROM "AnalyticsLegacySnapshot" s CROSS JOIN LATERAL (SELECT count(*)::bigint q FROM "AnalyticsLedger" l WHERE l."Kind"='session' AND l."RecordType"='event' AND l."OccurredAt"<s."CapturedAt") v
WHERE s."Kind"='website' ON CONFLICT DO NOTHING;

-- ViewCount is a rebuildable compatibility projection, never an independent source.
UPDATE "AnalyticsCollection" SET "MovieImportedAt" = COALESCE("MovieImportedAt", "CanonicalAt") WHERE "Id"=1;
CREATE OR REPLACE FUNCTION analytics_counter_projection() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE k text; cid text; BEGIN
 IF TG_TABLE_NAME='News' THEN k:='article'; cid:=NEW."NewsId"; ELSE k:='reel'; cid:=NEW."ReelId"; END IF;
 NEW."ViewCount":=LEAST(2147483647,COALESCE((SELECT sum("Quantity") FROM "AnalyticsLedger" WHERE "Kind"=k AND "ContentId"=cid AND "Included" AND "Period"='' AND "RecordType" IN ('event','balance')),0));
 RETURN NEW; END $$;
DROP TRIGGER IF EXISTS analytics_news_projection ON "News";
CREATE TRIGGER analytics_news_projection BEFORE INSERT OR UPDATE OF "ViewCount" ON "News" FOR EACH ROW EXECUTE FUNCTION analytics_counter_projection();
DROP TRIGGER IF EXISTS analytics_reel_projection ON "Reel";
CREATE TRIGGER analytics_reel_projection BEFORE INSERT OR UPDATE OF "ViewCount" ON "Reel" FOR EACH ROW EXECUTE FUNCTION analytics_counter_projection();
CREATE OR REPLACE FUNCTION analytics_refresh_projection() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW."Kind"='article' THEN UPDATE "News" SET "ViewCount"="ViewCount" WHERE "NewsId"=NEW."ContentId";
 ELSIF NEW."Kind"='reel' THEN UPDATE "Reel" SET "ViewCount"="ViewCount" WHERE "ReelId"=NEW."ContentId"; END IF;
 RETURN NEW; END $$;
DROP TRIGGER IF EXISTS analytics_refresh_projection ON "AnalyticsLedger";
CREATE TRIGGER analytics_refresh_projection AFTER INSERT OR UPDATE ON "AnalyticsLedger" FOR EACH ROW EXECUTE FUNCTION analytics_refresh_projection();
UPDATE "News" SET "ViewCount"="ViewCount";
UPDATE "Reel" SET "ViewCount"="ViewCount";

-- Bridges are write-only deployment compatibility, not reporting unions/workers.
CREATE OR REPLACE FUNCTION analytics_bridge_event() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 INSERT INTO "AnalyticsLedger" ("EventId","Kind","OccurredAt","LocalHour","SessionId","ContentId","Title","Path","Source","SourceId")
 VALUES (NEW."EventId",NEW."Kind",NEW."OccurredAt",NEW."LocalHour",NEW."SessionId",NEW."ContentId",NEW."Title",NEW."Path",'analytics-v1',NEW."EventId") ON CONFLICT DO NOTHING; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS analytics_bridge ON "AnalyticsEvent";
CREATE TRIGGER analytics_bridge AFTER INSERT ON "AnalyticsEvent" FOR EACH ROW EXECUTE FUNCTION analytics_bridge_event();
CREATE OR REPLACE FUNCTION analytics_bridge_movie() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 INSERT INTO "AnalyticsLedger" ("EventId","Kind","OccurredAt","LocalHour","SessionId","ContentId","Title","Path","Source","SourceId","UserId","ActorName","ServerId","ServerName","EpisodeSlug","EpisodeName","LegacyAuditTrailId")
 VALUES (NEW."EventId",'movie',NEW."OccurredAt",NEW."LocalHour",NEW."SessionId",NEW."MovieSlug",NEW."MovieTitle",'/phim/'||NEW."MovieSlug",NEW."Source",NEW."EventId",NEW."UserId",NEW."ActorName",NEW."ServerId",NEW."ServerName",NEW."EpisodeSlug",NEW."EpisodeName",NEW."LegacyAuditTrailId") ON CONFLICT DO NOTHING; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS analytics_bridge ON "MovieViewLog";
CREATE TRIGGER analytics_bridge AFTER INSERT ON "MovieViewLog" FOR EACH ROW EXECUTE FUNCTION analytics_bridge_movie();
CREATE OR REPLACE FUNCTION analytics_bridge_session() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 INSERT INTO "AnalyticsLedger" ("EventId","Kind","OccurredAt","LocalHour","SessionId","Source","SourceId")
 VALUES ('session:'||NEW."SessionId",'session',NEW."StartedAt",NEW."StartedLocalHour",NEW."SessionId",NEW."Source",NEW."SessionId") ON CONFLICT DO NOTHING; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS analytics_bridge ON "WebsiteSession";
CREATE TRIGGER analytics_bridge AFTER INSERT ON "WebsiteSession" FOR EACH ROW EXECUTE FUNCTION analytics_bridge_session();

-- Fail the migration rather than commit a partial conversion. Original sources
-- and OriginalValue on balances remain available for backup/reconciliation.
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM "AnalyticsEvent" a WHERE NOT EXISTS (SELECT 1 FROM "AnalyticsLedger" l WHERE l."EventId"=a."EventId"))
 OR EXISTS (SELECT 1 FROM "MovieViewLog" a WHERE NOT EXISTS (SELECT 1 FROM "AnalyticsLedger" l WHERE l."EventId"=a."EventId"))
 OR EXISTS (SELECT 1 FROM "WebsiteSession" a WHERE NOT EXISTS (SELECT 1 FROM "AnalyticsLedger" l WHERE l."EventId"='session:'||a."SessionId"))
 THEN RAISE EXCEPTION 'Analytics conversion incomplete: original facts missing from ledger'; END IF;
 IF EXISTS (SELECT 1 FROM "News" n JOIN "AnalyticsLedger" l ON l."Kind"='article' AND l."ContentId"=n."NewsId" AND l."RecordType"='balance' AND l."Included" WHERE n."ViewCount" <> LEAST(2147483647, l."Quantity" + (SELECT COALESCE(sum(e."Quantity"),0) FROM "AnalyticsLedger" e WHERE e."Kind"='article' AND e."ContentId"=n."NewsId" AND e."RecordType"='event' AND e."Included")))
 THEN RAISE EXCEPTION 'Article projection reconciliation failed'; END IF;
END $$;
