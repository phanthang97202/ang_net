-- Module Reels: video/anh dang doc, giong TikTok/Instagram Reels.
-- Reel la bang cha (metadata + counter). Moi Reel co the la 1 video hoac nhieu anh (carousel),
-- cac file media thuc te nam trong ReelMedia (1-n, sap xep theo SortOrder).
-- LikeReel / ReelComment theo dung pattern LikeNews / NewsComment da co san.

CREATE TABLE "Reel" (
    "ReelId" text NOT NULL,
    "UserId" text NOT NULL,
    "Caption" text NOT NULL,
    "MediaType" varchar(20) NOT NULL,
    "CoverUrl" text NOT NULL,
    "ViewCount" integer NOT NULL,
    "LikeCount" integer NOT NULL,
    "CommentCount" integer NOT NULL,
    "FlagActive" boolean NOT NULL,
    "CreatedBy" text NOT NULL,
    "UpdatedBy" text NOT NULL,
    "CreatedDTime" timestamp with time zone NOT NULL,
    "UpdatedDTime" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Reel" PRIMARY KEY ("ReelId"),
    CONSTRAINT "FK_Reel_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);

CREATE TABLE "ReelMedia" (
    "ReelMediaId" text NOT NULL,
    "ReelId" text NOT NULL,
    "MediaUrl" text NOT NULL,
    "SortOrder" integer NOT NULL,
    "DurationSeconds" integer NULL,
    "Width" integer NULL,
    "Height" integer NULL,
    "FlagActive" boolean NOT NULL,
    "CreatedBy" text NOT NULL,
    "UpdatedBy" text NOT NULL,
    "CreatedDTime" timestamp with time zone NOT NULL,
    "UpdatedDTime" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_ReelMedia" PRIMARY KEY ("ReelMediaId"),
    CONSTRAINT "FK_ReelMedia_Reel_ReelId" FOREIGN KEY ("ReelId") REFERENCES "Reel" ("ReelId") ON DELETE CASCADE
);

CREATE TABLE "LikeReel" (
    "LikeReelId" text NOT NULL,
    "ReelId" text NOT NULL,
    "UserId" text NOT NULL,
    "FlagActive" boolean NOT NULL,
    "CreatedBy" text NOT NULL,
    "UpdatedBy" text NOT NULL,
    "CreatedDTime" timestamp with time zone NOT NULL,
    "UpdatedDTime" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_LikeReel" PRIMARY KEY ("LikeReelId"),
    CONSTRAINT "FK_LikeReel_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_LikeReel_Reel_ReelId" FOREIGN KEY ("ReelId") REFERENCES "Reel" ("ReelId") ON DELETE CASCADE
);

CREATE TABLE "ReelComment" (
    "CommentId" text NOT NULL,
    "ReelId" text NOT NULL,
    "UserId" text NOT NULL,
    "ParentCommentId" text NULL,
    "Content" text NOT NULL,
    "ReplyCount" integer NOT NULL,
    "FlagActive" boolean NOT NULL,
    "CreatedBy" text NOT NULL,
    "UpdatedBy" text NOT NULL,
    "CreatedDTime" timestamp with time zone NOT NULL,
    "UpdatedDTime" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_ReelComment" PRIMARY KEY ("CommentId"),
    CONSTRAINT "FK_ReelComment_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_ReelComment_ReelComment_ParentCommentId" FOREIGN KEY ("ParentCommentId") REFERENCES "ReelComment" ("CommentId") ON DELETE CASCADE,
    CONSTRAINT "FK_ReelComment_Reel_ReelId" FOREIGN KEY ("ReelId") REFERENCES "Reel" ("ReelId") ON DELETE CASCADE
);
