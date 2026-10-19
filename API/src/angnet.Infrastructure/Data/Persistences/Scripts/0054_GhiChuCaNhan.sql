CREATE TABLE "PersonalNote" (
    "NoteId" text PRIMARY KEY,
    "OwnerId" text NOT NULL REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
    "Title" character varying(200) NOT NULL,
    "ContentJson" text NOT NULL,
    "ContentText" text NOT NULL,
    "Version" integer NOT NULL DEFAULT 1,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL
);
CREATE INDEX "IX_PersonalNote_OwnerId_UpdatedAt_NoteId"
    ON "PersonalNote" ("OwnerId", "UpdatedAt" DESC, "NoteId" DESC);
