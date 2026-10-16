ALTER TABLE "BlogNotification" ALTER COLUMN "CommentId" DROP NOT NULL;
ALTER TABLE "BlogNotification" ADD COLUMN "Point" double precision NULL;
CREATE UNIQUE INDEX "IX_BlogNotification_RecipientId_ActorId_NewsId_Kind"
    ON "BlogNotification" ("RecipientId", "ActorId", "NewsId", "Kind")
    WHERE "CommentId" IS NULL;
