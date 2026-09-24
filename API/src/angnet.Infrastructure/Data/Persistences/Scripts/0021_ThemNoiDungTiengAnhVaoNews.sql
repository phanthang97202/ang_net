-- Bo sung ban dich tieng Anh nhap thu cong cho bai viet.
-- Cac cot cu duoc giu lam ban tieng Viet de tuong thich du lieu va API hien tai.

ALTER TABLE "News"
    ADD COLUMN "SlugEn" text NOT NULL DEFAULT '',
    ADD COLUMN "ShortTitleEn" text NOT NULL DEFAULT '',
    ADD COLUMN "ShortDescriptionEn" text NOT NULL DEFAULT '',
    ADD COLUMN "ContentBodyEn" text NOT NULL DEFAULT '';
