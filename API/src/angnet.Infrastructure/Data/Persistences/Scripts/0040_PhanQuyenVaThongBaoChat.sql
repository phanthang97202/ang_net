INSERT INTO "SysPermission" (
    "PermissionCode", "PermissionNameVi", "PermissionNameEn", "Module", "ModuleNameVi", "ModuleNameEn",
    "DescriptionVi", "DescriptionEn", "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES
('chat.view', 'Xem tin nhắn', 'View chat', 'chat', 'Nhắn tin', 'Chat', 'Xem và nhận tin nhắn trong phòng chung', 'Read and receive shared room messages', 1, true, 'system', 'system', now(), now()),
('chat.send', 'Gửi tin nhắn', 'Send chat', 'chat', 'Nhắn tin', 'Chat', 'Gửi tin nhắn; cần có cả quyền xem', 'Send messages; also requires view permission', 2, true, 'system', 'system', now(), now())
ON CONFLICT ("PermissionCode") DO NOTHING;

ALTER TABLE "Chat" ADD COLUMN "Sequence" bigserial NOT NULL;
WITH ordered AS (
    SELECT "MessageId", row_number() OVER (ORDER BY "CreatedDTime", "MessageId") AS seq FROM "Chat"
)
UPDATE "Chat" c SET "Sequence" = o.seq FROM ordered o WHERE c."MessageId" = o."MessageId";
SELECT setval(pg_get_serial_sequence('"Chat"', 'Sequence'),
    GREATEST(COALESCE((SELECT max("Sequence") FROM "Chat"), 0), 1), EXISTS(SELECT 1 FROM "Chat"));
CREATE UNIQUE INDEX "IX_Chat_Sequence" ON "Chat" ("Sequence");
CREATE TABLE "ChatReadState" (
    "UserId" text PRIMARY KEY REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
    "LastReadSequence" bigint NOT NULL DEFAULT 0
);
