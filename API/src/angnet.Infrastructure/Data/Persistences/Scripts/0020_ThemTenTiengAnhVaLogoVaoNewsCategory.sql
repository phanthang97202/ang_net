-- Bo sung noi dung song ngu va logo cho danh muc bai viet.
-- NewsCategoryName hien tai duoc giu lam ten tieng Viet de tuong thich du lieu/API cu.

ALTER TABLE "NewsCategory"
    ADD COLUMN "NewsCategoryNameEn" text NOT NULL DEFAULT '',
    ADD COLUMN "NewsCategoryLogo" text NOT NULL DEFAULT '';

-- Du lieu cu chua co ban dich: dung ten tieng Viet lam fallback ban dau de giao dien
-- tieng Anh khong bi trong sau khi nang cap. Quan tri vien co the sua lai sau.
UPDATE "NewsCategory"
SET "NewsCategoryNameEn" = "NewsCategoryName"
WHERE "NewsCategoryNameEn" = '';
