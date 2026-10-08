-- Do not merge/delete historical users: fail clearly if existing emails collide.
-- Required when username is no longer equal to email, including concurrent Google signup.
DROP INDEX "EmailIndex";
CREATE UNIQUE INDEX "EmailIndex" ON "AspNetUsers" ("NormalizedEmail")
    WHERE "NormalizedEmail" IS NOT NULL;
