ALTER TABLE "PersonalNote" ADD COLUMN "PublicToken" character varying(64);
ALTER TABLE "PersonalNote" ADD COLUMN "PublishedTitle" character varying(200);
ALTER TABLE "PersonalNote" ADD COLUMN "PublishedContentJson" text;
ALTER TABLE "PersonalNote" ADD COLUMN "PublishedAt" timestamp with time zone;
CREATE UNIQUE INDEX "IX_PersonalNote_PublicToken" ON "PersonalNote" ("PublicToken");
