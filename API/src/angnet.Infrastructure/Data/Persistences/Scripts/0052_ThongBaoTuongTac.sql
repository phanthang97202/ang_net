CREATE TABLE "BlogNotification" (
    "NotificationId" text PRIMARY KEY,
    "RecipientId" text NOT NULL REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
    "ActorId" text NOT NULL REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
    "NewsId" text NOT NULL REFERENCES "News" ("NewsId") ON DELETE CASCADE,
    "CommentId" text NOT NULL REFERENCES "NewsComment" ("CommentId") ON DELETE CASCADE,
    "Kind" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "ReadAt" timestamp with time zone NULL
);
CREATE UNIQUE INDEX "IX_BlogNotification_RecipientId_CommentId"
    ON "BlogNotification" ("RecipientId", "CommentId");
CREATE INDEX "IX_BlogNotification_RecipientId_CreatedAt_NotificationId"
    ON "BlogNotification" ("RecipientId", "CreatedAt" DESC, "NotificationId" DESC);
CREATE INDEX "IX_BlogNotification_RecipientId_ReadAt"
    ON "BlogNotification" ("RecipientId", "ReadAt");
CREATE INDEX "IX_BlogNotification_ActorId" ON "BlogNotification" ("ActorId");
CREATE INDEX "IX_BlogNotification_NewsId" ON "BlogNotification" ("NewsId");
CREATE INDEX "IX_BlogNotification_CommentId" ON "BlogNotification" ("CommentId");
