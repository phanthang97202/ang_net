-- Legacy sessions have version 0; the first revocation invalidates them too.
ALTER TABLE "AspNetUsers" ADD COLUMN "SessionVersion" integer NOT NULL DEFAULT 0;
ALTER TABLE "RefreshToken" ADD COLUMN "SessionVersion" integer NOT NULL DEFAULT 0;
