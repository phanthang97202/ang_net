-- Ghim bai viet len dau danh sach trang chu.
--
-- Truoc day thu tu hoan toan theo CreatedDTime, khong co cach nao dua mot bai
-- quan trong len tren ma khong sua ngay dang (lam vay thi sai du lieu that).
--
-- PinOrder de sap xep giua cac bai cung ghim: so nho hien truoc. Khong dung
-- PinOrder = 0 lam "khong ghim" vi 0 cung la mot thu tu hop le - trang thai ghim
-- do IsPinned quyet dinh, PinOrder chi co nghia khi IsPinned = true.
ALTER TABLE "News" ADD COLUMN "IsPinned" boolean NOT NULL DEFAULT false;
ALTER TABLE "News" ADD COLUMN "PinOrder" integer NOT NULL DEFAULT 0;

-- Moi truy van danh sach bai deu sap theo ghim truoc roi moi den ngay dang.
-- Index mot phan (chi cac dong dang ghim) vi so bai ghim luon rat nho so voi
-- tong so bai - index day du chi ton cho ma khong nhanh hon.
CREATE INDEX "IX_News_IsPinned_PinOrder" ON "News" ("IsPinned", "PinOrder")
    WHERE "IsPinned" = true;
