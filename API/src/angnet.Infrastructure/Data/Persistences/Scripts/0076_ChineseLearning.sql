CREATE TABLE "ChineseExercise" (
  "Id" varchar(36) PRIMARY KEY, "OwnerId" text NOT NULL REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
  "Kind" varchar(16) NOT NULL, "Topic" varchar(40) NOT NULL, "Text" varchar(500) NOT NULL,
  "Pinyin" varchar(800) NOT NULL, "Translation" varchar(1000) NOT NULL, "WordsJson" text NOT NULL, "CreatedAt" timestamptz NOT NULL
);
CREATE INDEX "IX_ChineseExercise_OwnerId_Kind_Topic" ON "ChineseExercise" ("OwnerId", "Kind", "Topic");
CREATE TABLE "ChineseVocabulary" (
  "Id" varchar(36) PRIMARY KEY, "OwnerId" text NOT NULL REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
  "Word" varchar(60) NOT NULL, "Pinyin" varchar(120) NOT NULL, "Meaning" varchar(240) NOT NULL,
  "Example" varchar(500) NOT NULL, "ExamplePinyin" varchar(800) NOT NULL, "ExampleTranslation" varchar(1000) NOT NULL,
  "Collection" varchar(80) NOT NULL, "CreatedAt" timestamptz NOT NULL
);
CREATE UNIQUE INDEX "IX_ChineseVocabulary_OwnerId_Collection_Word" ON "ChineseVocabulary" ("OwnerId", "Collection", "Word");
INSERT INTO "SysPermission" ("PermissionCode", "PermissionNameVi", "PermissionNameEn", "Module", "ModuleNameVi", "ModuleNameEn", "DescriptionVi", "DescriptionEn", "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime")
VALUES ('chinese.use', 'Học tiếng Trung', 'Learn Chinese', 'chinese', 'Học tiếng Trung', 'Learn Chinese', 'Luyện tiếng Trung và quản lý từ vựng cá nhân', 'Practice Chinese and manage personal vocabulary', 1, true, 'system', 'system', now(), now()) ON CONFLICT ("PermissionCode") DO NOTHING;
INSERT INTO "SysMenu" ("MenuId", "ParentId", "TitleVi", "TitleEn", "Path", "Icon", "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime")
VALUES ('chinese-learning', NULL, 'Học tiếng Trung', 'Learn Chinese', '/chinese', 'read', 10, true, 'system', 'system', now(), now()) ON CONFLICT ("MenuId") DO NOTHING;
