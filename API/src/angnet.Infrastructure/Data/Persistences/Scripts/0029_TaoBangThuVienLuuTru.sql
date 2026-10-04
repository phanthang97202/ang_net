-- Module Thu vien luu tru: moi nguoi dung co cac Bo suu tap rieng, moi bo chua
-- nhieu muc (anh/video tu tai len, hoac link ngoai YouTube/TikTok/Facebook/Instagram...).
--
-- Quy tac quyen:
--   * Chi chu so huu (OwnerId) duoc sua/xoa bo suu tap va cac muc ben trong.
--   * Visibility nam o cap BO SUU TAP, khong o tung muc: mot muc chi thuoc dung
--     mot bo, nen bo cong khai thi muc cong khai, khong co truong hop mo ho.
--   * Admin KHONG duoc xem bo Private cua nguoi khac (khac voi PermissionHandler).
--
-- ArchiveItem.OwnerId lap lai OwnerId cua bo suu tap: cho phep kiem tra quyen
-- va tinh dung luong theo nguoi dung ma khong can join.

CREATE TABLE "ArchiveCollection" (
    "CollectionId" text NOT NULL,
    "OwnerId" text NOT NULL,
    "Name" text NOT NULL,
    "Description" text NOT NULL,
    "CoverUrl" text NOT NULL,
    "Visibility" varchar(20) NOT NULL DEFAULT 'Private',
    "SortOrder" integer NOT NULL,
    "FlagActive" boolean NOT NULL,
    "CreatedBy" text NOT NULL,
    "UpdatedBy" text NOT NULL,
    "CreatedDTime" timestamp with time zone NOT NULL,
    "UpdatedDTime" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_ArchiveCollection" PRIMARY KEY ("CollectionId"),
    CONSTRAINT "FK_ArchiveCollection_AspNetUsers_OwnerId" FOREIGN KEY ("OwnerId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
    CONSTRAINT "CK_ArchiveCollection_Visibility" CHECK ("Visibility" IN ('Private', 'Unlisted', 'Public'))
);

-- Man "Thu vien cua toi" luon doc theo chu so huu roi den thu tu
CREATE INDEX "IX_ArchiveCollection_OwnerId_SortOrder" ON "ArchiveCollection" ("OwnerId", "SortOrder");

-- Kind: Image | Video | Link - quyet dinh cach hien thi.
-- Provider: noi chua noi dung (Cloudinary | YouTube | TikTok | Facebook | Instagram | Web).
--   Luu dang chuoi de them nguon moi chi can them gia tri enum, khong doi bang.
-- StoragePublicId: public_id tren Cloudinary, chi co voi file tu tai len; dung de
--   xoa file khi xoa muc. Rong voi link ngoai.
-- TakenAt: ngay dien ra ky niem, khac ngay tai len (CreatedDTime).
CREATE TABLE "ArchiveItem" (
    "ItemId" text NOT NULL,
    "CollectionId" text NOT NULL,
    "OwnerId" text NOT NULL,
    "Kind" varchar(20) NOT NULL,
    "Provider" varchar(30) NOT NULL,
    "SourceUrl" text NOT NULL,
    "StoragePublicId" text NOT NULL,
    "Title" text NOT NULL,
    "Note" text NOT NULL,
    "ThumbnailUrl" text NOT NULL,
    "Width" integer NULL,
    "Height" integer NULL,
    "DurationSeconds" integer NULL,
    "Bytes" bigint NULL,
    "TakenAt" timestamp with time zone NULL,
    "FlagActive" boolean NOT NULL,
    "CreatedBy" text NOT NULL,
    "UpdatedBy" text NOT NULL,
    "CreatedDTime" timestamp with time zone NOT NULL,
    "UpdatedDTime" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_ArchiveItem" PRIMARY KEY ("ItemId"),
    CONSTRAINT "FK_ArchiveItem_ArchiveCollection_CollectionId" FOREIGN KEY ("CollectionId") REFERENCES "ArchiveCollection" ("CollectionId") ON DELETE CASCADE,
    CONSTRAINT "FK_ArchiveItem_AspNetUsers_OwnerId" FOREIGN KEY ("OwnerId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
    CONSTRAINT "CK_ArchiveItem_Kind" CHECK ("Kind" IN ('Image', 'Video', 'Link'))
);

-- Trong mot bo, muc moi nhat len dau
CREATE INDEX "IX_ArchiveItem_CollectionId_CreatedDTime" ON "ArchiveItem" ("CollectionId", "CreatedDTime");
CREATE INDEX "IX_ArchiveItem_OwnerId" ON "ArchiveItem" ("OwnerId");
