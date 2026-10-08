CREATE TABLE "MovieWishlist" (
    "WishlistId" text NOT NULL,
    "UserId" text NOT NULL,
    "Provider" character varying(40) NOT NULL,
    "MovieSlug" character varying(200) NOT NULL,
    "Title" character varying(500) NOT NULL,
    "OriginalTitle" character varying(500) NOT NULL,
    "PosterUrl" character varying(2048) NOT NULL,
    "Year" integer NOT NULL,
    "FlagActive" boolean NOT NULL,
    "CreatedBy" text NOT NULL,
    "UpdatedBy" text NOT NULL,
    "CreatedDTime" timestamp with time zone NOT NULL,
    "UpdatedDTime" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_MovieWishlist" PRIMARY KEY ("WishlistId"),
    CONSTRAINT "FK_MovieWishlist_AspNetUsers_UserId" FOREIGN KEY ("UserId")
        REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);

-- Retain an inactive row on removal; saving again reactivates the same entry.
CREATE UNIQUE INDEX "IX_MovieWishlist_UserId_Provider_MovieSlug"
    ON "MovieWishlist" ("UserId", "Provider", "MovieSlug");
CREATE INDEX "IX_MovieWishlist_Owner_Feed"
    ON "MovieWishlist" ("UserId", "Provider", "FlagActive", "CreatedDTime" DESC, "WishlistId" DESC);
