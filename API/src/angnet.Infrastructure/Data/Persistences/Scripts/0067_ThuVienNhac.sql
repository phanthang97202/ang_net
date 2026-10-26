-- Module Thu vien nhac: nut Luu (bookmark) + Bo suu tap nhac, giong TikTok.
--
-- Thiet ke 3 lop de mo rong nhieu nguon phat (YouTube, Audius, sau nay them nguon khac):
--   * MusicTrack: danh muc bai DUNG CHUNG cho moi nguoi dung, 1 bai cua 1 nguon = 1 dong
--     (UNIQUE Provider + ExternalId). Chi la ban chup metadata do SERVER lay tu nguon,
--     khong tin client, khong luu file / stream URL.
--   * MusicSave: "Da luu" cua tung nguoi (khoa chinh UserId + TrackId).
--   * MusicCollection + MusicCollectionItem: bo suu tap, 1 bai co the nam o nhieu bo.
--
-- Provider luu dang chuoi va KHONG co CHECK: them nguon moi chi can them gia tri enum
-- EMusicProvider + mot IMusicTrackSource, khong phai doi bang.
--
-- Quy tac quyen giong Thu vien luu tru: chi chu so huu sua/xoa; bo Private chi chu
-- so huu xem duoc, ke ca Admin.
--
-- Xoa bai khoi "Da luu" thi go khoi moi bo cua nguoi do (service lam trong 1 transaction).
-- MusicTrack khong bao gio bi xoa theo nguoi dung (ON DELETE RESTRICT) vi nguoi khac
-- co the dang luu cung bai.

CREATE TABLE "MusicTrack" (
    "TrackId" text NOT NULL,
    "Provider" varchar(30) NOT NULL,
    "ExternalId" text NOT NULL,
    "Title" text NOT NULL,
    "Artist" text NOT NULL,
    "ThumbnailUrl" text NOT NULL,
    "DurationSeconds" integer NULL,
    "ExternalUrl" text NOT NULL,
    "Metadata" jsonb NOT NULL DEFAULT '{}',
    "Availability" varchar(20) NOT NULL DEFAULT 'Available',
    "FlagActive" boolean NOT NULL,
    "CreatedBy" text NOT NULL,
    "UpdatedBy" text NOT NULL,
    "CreatedDTime" timestamp with time zone NOT NULL,
    "UpdatedDTime" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_MusicTrack" PRIMARY KEY ("TrackId"),
    CONSTRAINT "CK_MusicTrack_Availability" CHECK ("Availability" IN ('Available', 'Unavailable'))
);

-- Chong trung bai va de upsert ON CONFLICT khi nhieu nguoi luu cung luc
CREATE UNIQUE INDEX "IX_MusicTrack_Provider_ExternalId" ON "MusicTrack" ("Provider", "ExternalId");

CREATE TABLE "MusicSave" (
    "UserId" text NOT NULL,
    "TrackId" text NOT NULL,
    "CreatedDTime" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_MusicSave" PRIMARY KEY ("UserId", "TrackId"),
    CONSTRAINT "FK_MusicSave_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_MusicSave_MusicTrack_TrackId" FOREIGN KEY ("TrackId") REFERENCES "MusicTrack" ("TrackId") ON DELETE RESTRICT
);

-- Man "Da luu": theo nguoi dung, moi nhat len dau
CREATE INDEX "IX_MusicSave_UserId_CreatedDTime" ON "MusicSave" ("UserId", "CreatedDTime" DESC);
CREATE INDEX "IX_MusicSave_TrackId" ON "MusicSave" ("TrackId");

CREATE TABLE "MusicCollection" (
    "CollectionId" text NOT NULL,
    "OwnerId" text NOT NULL,
    "Name" text NOT NULL,
    "Description" text NOT NULL,
    "Visibility" varchar(20) NOT NULL DEFAULT 'Private',
    "SortOrder" integer NOT NULL,
    "FlagActive" boolean NOT NULL,
    "CreatedBy" text NOT NULL,
    "UpdatedBy" text NOT NULL,
    "CreatedDTime" timestamp with time zone NOT NULL,
    "UpdatedDTime" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_MusicCollection" PRIMARY KEY ("CollectionId"),
    CONSTRAINT "FK_MusicCollection_AspNetUsers_OwnerId" FOREIGN KEY ("OwnerId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
    CONSTRAINT "CK_MusicCollection_Visibility" CHECK ("Visibility" IN ('Private', 'Unlisted', 'Public'))
);

CREATE INDEX "IX_MusicCollection_OwnerId_SortOrder" ON "MusicCollection" ("OwnerId", "SortOrder");

-- SortOrder: bai moi them lay (nho nhat - 1000) nen nam dau bo; doi cho 2 bai chi
-- can hoan doi 2 so, khong phai danh lai ca bo.
-- OwnerId lap lai chu bo suu tap: bo luu thi go bai khoi moi bo cua nguoi do ma khong can join.
CREATE TABLE "MusicCollectionItem" (
    "CollectionId" text NOT NULL,
    "TrackId" text NOT NULL,
    "OwnerId" text NOT NULL,
    "SortOrder" integer NOT NULL,
    "AddedDTime" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_MusicCollectionItem" PRIMARY KEY ("CollectionId", "TrackId"),
    CONSTRAINT "FK_MusicCollectionItem_MusicCollection_CollectionId" FOREIGN KEY ("CollectionId") REFERENCES "MusicCollection" ("CollectionId") ON DELETE CASCADE,
    CONSTRAINT "FK_MusicCollectionItem_MusicTrack_TrackId" FOREIGN KEY ("TrackId") REFERENCES "MusicTrack" ("TrackId") ON DELETE RESTRICT,
    CONSTRAINT "FK_MusicCollectionItem_AspNetUsers_OwnerId" FOREIGN KEY ("OwnerId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_MusicCollectionItem_CollectionId_SortOrder" ON "MusicCollectionItem" ("CollectionId", "SortOrder");
CREATE INDEX "IX_MusicCollectionItem_OwnerId_TrackId" ON "MusicCollectionItem" ("OwnerId", "TrackId");
CREATE INDEX "IX_MusicCollectionItem_TrackId" ON "MusicCollectionItem" ("TrackId");

-- Cap nhat mo ta quyen music.use: nay gom ca YouTube va Thu vien nhac
UPDATE "SysPermission"
SET "DescriptionVi" = 'Mở module âm nhạc, phát nhạc từ YouTube/Audius, lưu bài và tạo bộ sưu tập nhạc',
    "DescriptionEn" = 'Open the music module, play music from YouTube/Audius, save tracks and build music collections',
    "UpdatedBy" = 'system',
    "UpdatedDTime" = now()
WHERE "PermissionCode" = 'music.use';
