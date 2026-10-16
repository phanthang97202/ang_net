CREATE TABLE "BlogActivity" (
    "ActivityId" text PRIMARY KEY,
    "UserId" text NOT NULL REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
    "NewsId" text NOT NULL REFERENCES "News" ("NewsId") ON DELETE CASCADE,
    "Kind" text NOT NULL,
    "CommentId" text NULL,
    "Point" double precision NULL,
    "OccurredAt" timestamp with time zone NOT NULL
);
CREATE INDEX "IX_BlogActivity_UserId_OccurredAt_ActivityId"
    ON "BlogActivity" ("UserId", "OccurredAt" DESC, "ActivityId" DESC);
CREATE INDEX "IX_BlogActivity_NewsId" ON "BlogActivity" ("NewsId");
CREATE INDEX "IX_LikeNews_UserId_CreatedDTime_LikeNewsId"
    ON "LikeNews" ("UserId", "CreatedDTime" DESC, "LikeNewsId" DESC);

-- Recover only facts that still exist. Old unlikes/deleted reactions cannot be reconstructed.
INSERT INTO "BlogActivity" ("ActivityId", "UserId", "NewsId", "Kind", "CommentId", "Point", "OccurredAt")
SELECT 'like:' || l."LikeNewsId", l."UserId", l."NewsId", 'PostLiked', NULL, NULL, l."CreatedDTime"
FROM "LikeNews" l JOIN "AspNetUsers" u ON u."Id" = l."UserId" JOIN "News" n ON n."NewsId" = l."NewsId";

INSERT INTO "BlogActivity" ("ActivityId", "UserId", "NewsId", "Kind", "CommentId", "Point", "OccurredAt")
SELECT 'comment:' || c."CommentId", c."UserId", c."NewsId", 'Commented', c."CommentId", NULL, c."CreatedDTime"
FROM "NewsComment" c JOIN "AspNetUsers" u ON u."Id" = c."UserId" JOIN "News" n ON n."NewsId" = c."NewsId"
WHERE c."FlagActive" AND c."Status" <> 'Deleted';

INSERT INTO "BlogActivity" ("ActivityId", "UserId", "NewsId", "Kind", "CommentId", "Point", "OccurredAt")
SELECT 'reaction:' || r."CommentId" || ':' || r."UserId", r."UserId", c."NewsId", 'CommentLiked', c."CommentId", NULL, r."CreatedDTime"
FROM "NewsCommentReaction" r JOIN "NewsComment" c ON c."CommentId" = r."CommentId"
JOIN "AspNetUsers" u ON u."Id" = r."UserId" JOIN "News" n ON n."NewsId" = c."NewsId";

INSERT INTO "BlogActivity" ("ActivityId", "UserId", "NewsId", "Kind", "CommentId", "Point", "OccurredAt")
SELECT 'rating:' || p."NewsId" || ':' || p."UserId", p."UserId", p."NewsId", 'Rated', NULL, p."Point",
    GREATEST(p."CreatedDTime", p."UpdatedDTime")
FROM "PointNews" p JOIN "AspNetUsers" u ON u."Id" = p."UserId" JOIN "News" n ON n."NewsId" = p."NewsId";
