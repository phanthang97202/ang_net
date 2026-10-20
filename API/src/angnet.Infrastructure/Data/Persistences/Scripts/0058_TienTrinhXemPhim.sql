CREATE TABLE "MovieWatchProgress" (
    "UserId" text NOT NULL REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
    "Provider" character varying(40) NOT NULL,
    "MovieSlug" character varying(200) NOT NULL,
    "ServerId" integer NOT NULL,
    "ServerName" character varying(200) NOT NULL,
    "EpisodeSlug" character varying(200) NOT NULL,
    "EpisodeName" character varying(200) NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_MovieWatchProgress" PRIMARY KEY ("UserId", "Provider", "MovieSlug")
);
