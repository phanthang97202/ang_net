ALTER TABLE "PersonalNote" ADD COLUMN "EditToken" character varying(64);
CREATE UNIQUE INDEX "IX_PersonalNote_EditToken" ON "PersonalNote" ("EditToken");
