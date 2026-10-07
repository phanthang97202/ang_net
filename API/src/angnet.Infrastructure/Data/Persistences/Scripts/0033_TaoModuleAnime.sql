-- Module anime MVP. Metadata, tap phim va nguon phat duoc tach rieng de sau nay
-- co the bo sung provider/lich su xem ma khong phai thay schema cot loi.
CREATE TABLE "Anime" (
    "AnimeId" text NOT NULL,
    "AniListId" integer NOT NULL,
    "Title" character varying(300) NOT NULL,
    "NativeTitle" character varying(300) NOT NULL,
    "Description" text NOT NULL,
    "CoverImageUrl" character varying(1000) NOT NULL,
    "BannerImageUrl" character varying(1000) NOT NULL,
    "Format" character varying(40) NOT NULL,
    "Status" character varying(40) NOT NULL,
    "ReleaseYear" integer,
    "EpisodeCount" integer,
    "FlagActive" boolean NOT NULL,
    "CreatedBy" text NOT NULL,
    "UpdatedBy" text NOT NULL,
    "CreatedDTime" timestamp with time zone NOT NULL,
    "UpdatedDTime" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Anime" PRIMARY KEY ("AnimeId")
);

CREATE UNIQUE INDEX "IX_Anime_AniListId" ON "Anime" ("AniListId");

CREATE TABLE "AnimeEpisode" (
    "EpisodeId" text NOT NULL,
    "AnimeId" text NOT NULL,
    "EpisodeNumber" integer NOT NULL,
    "Title" character varying(300) NOT NULL,
    "ThumbnailUrl" character varying(1000) NOT NULL,
    "DurationSeconds" integer,
    "SortOrder" integer NOT NULL,
    "FlagActive" boolean NOT NULL,
    "CreatedBy" text NOT NULL,
    "UpdatedBy" text NOT NULL,
    "CreatedDTime" timestamp with time zone NOT NULL,
    "UpdatedDTime" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_AnimeEpisode" PRIMARY KEY ("EpisodeId"),
    CONSTRAINT "FK_AnimeEpisode_Anime_AnimeId" FOREIGN KEY ("AnimeId")
        REFERENCES "Anime" ("AnimeId") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "IX_AnimeEpisode_AnimeId_EpisodeNumber"
    ON "AnimeEpisode" ("AnimeId", "EpisodeNumber");

CREATE TABLE "AnimeSource" (
    "SourceId" text NOT NULL,
    "EpisodeId" text NOT NULL,
    "Provider" character varying(30) NOT NULL,
    "SourceValue" character varying(2000) NOT NULL,
    "Quality" character varying(30) NOT NULL,
    "Language" character varying(100) NOT NULL,
    "Priority" integer NOT NULL,
    "FlagActive" boolean NOT NULL,
    "CreatedBy" text NOT NULL,
    "UpdatedBy" text NOT NULL,
    "CreatedDTime" timestamp with time zone NOT NULL,
    "UpdatedDTime" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_AnimeSource" PRIMARY KEY ("SourceId"),
    CONSTRAINT "FK_AnimeSource_AnimeEpisode_EpisodeId" FOREIGN KEY ("EpisodeId")
        REFERENCES "AnimeEpisode" ("EpisodeId") ON DELETE CASCADE
);

CREATE INDEX "IX_AnimeSource_EpisodeId_Priority"
    ON "AnimeSource" ("EpisodeId", "Priority");

INSERT INTO "SysPermission" (
    "PermissionCode", "PermissionNameVi", "PermissionNameEn",
    "Module", "ModuleNameVi", "ModuleNameEn",
    "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'anime.view', 'Xem anime', 'View anime',
    'anime', 'Anime', 'Anime',
    'Tim kiem, xem danh sach tap va phat anime da duoc cau hinh nguon',
    'Search, browse episodes and play anime with configured sources',
    1, true, 'system', 'system', now(), now()
);

-- Vai tro co san de quan tri vien chi can gan vao tai khoan duoc phep xem.
INSERT INTO "AspNetRoles" ("Id", "Name", "NormalizedName", "ConcurrencyStamp")
VALUES ('37b814c5-a787-42c5-9e69-f0192437489f', 'Anime Viewer', 'ANIME VIEWER', 'anime-viewer-v1');

INSERT INTO "AspNetRoleClaims" ("RoleId", "ClaimType", "ClaimValue")
VALUES ('37b814c5-a787-42c5-9e69-f0192437489f', 'permission', 'anime.view');

INSERT INTO "SysMenu" (
    "MenuId", "ParentId", "TitleVi", "TitleEn", "Path", "Icon",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'anime', NULL, 'Anime', 'Anime', '/anime', 'play-circle',
    6, true, 'system', 'system', now(), now()
);
