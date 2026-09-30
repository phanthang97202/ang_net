-- News.WhoCanSee da co tu schema ban dau, nhung model cu chua cau hinh enum -> string
-- va chua gui gia tri tu API. Chuan hoa du lieu cu truoc khi bat dau dung cot nay.
ALTER TABLE "News"
    ALTER COLUMN "WhoCanSee" TYPE varchar(20)
    USING CASE "WhoCanSee"::text
        WHEN '0' THEN 'Public'
        WHEN '1' THEN 'Tenant'
        WHEN '2' THEN 'Private'
        WHEN 'Tenant' THEN 'Tenant'
        WHEN 'Private' THEN 'Private'
        ELSE 'Public'
    END;

UPDATE "News"
SET "WhoCanSee" = 'Public'
WHERE "WhoCanSee" IS NULL
   OR "WhoCanSee" NOT IN ('Public', 'Tenant', 'Private');

ALTER TABLE "News"
    ALTER COLUMN "WhoCanSee" SET DEFAULT 'Public',
    ALTER COLUMN "WhoCanSee" SET NOT NULL;

ALTER TABLE "News"
    DROP CONSTRAINT IF EXISTS "CK_News_WhoCanSee";

ALTER TABLE "News"
    ADD CONSTRAINT "CK_News_WhoCanSee"
    CHECK ("WhoCanSee" IN ('Public', 'Tenant', 'Private'));
