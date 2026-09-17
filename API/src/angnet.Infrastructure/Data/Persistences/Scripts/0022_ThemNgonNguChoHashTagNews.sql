-- Tach hashtag theo ngon ngu de bai viet tieng Anh khong hien hashtag tieng Viet.
-- Du lieu cu duoc xem la hashtag tieng Viet.

ALTER TABLE "HashTagNews"
    ADD COLUMN "LanguageCode" character varying(2) NOT NULL DEFAULT 'vi';

ALTER TABLE "HashTagNews"
    DROP CONSTRAINT "PK_HashTagNews",
    ADD CONSTRAINT "PK_HashTagNews" PRIMARY KEY ("HashTagNewsId", "NewsId", "LanguageCode");
