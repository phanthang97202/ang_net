-- Ghi chu cong khai: khach khong can dang nhap duoc tao, nhung khong co luong
-- cap nhat noi dung. FlagActive chi danh cho quan tri vien an/hien ghi chu.
CREATE TABLE "Note" (
    "NoteId" text NOT NULL,
    "Alias" character varying(100) NOT NULL,
    "ContentBody" text NOT NULL,
    "FlagActive" boolean NOT NULL,
    "CreatedBy" text NOT NULL,
    "UpdatedBy" text NOT NULL,
    "CreatedDTime" timestamp with time zone NOT NULL,
    "UpdatedDTime" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Note" PRIMARY KEY ("NoteId")
);

-- Feed doc moi truoc, chi lay ban ghi dang hien thi.
CREATE INDEX "IX_Note_FlagActive_CreatedDTime_NoteId"
    ON "Note" ("FlagActive", "CreatedDTime" DESC, "NoteId" DESC);

-- Co san mot muc menu dang bat. Quan tri vien co the tat/xoa muc nay; API public
-- se bi khoa cung luc, ke ca khi go truc tiep /note.
INSERT INTO "SysMenu" (
    "MenuId", "ParentId", "TitleVi", "TitleEn", "Path", "Icon",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'note', NULL, 'Ghi chu', 'Notes', '/note', 'form',
    5, true, 'system', 'system', now(), now()
)
ON CONFLICT ("MenuId") DO NOTHING;
