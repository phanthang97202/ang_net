-- Danh sach chon (dropdown) rieng cua tung nguoi dung, dung chung mot bang cho moi module.
-- ListCode phan biet danh sach: CALENDAR_CATEGORY (Loai hoat dong), CALENDAR_STATUS (Trang
-- thai), EXPENSE_CATEGORY (Danh muc thu chi). Them danh sach moi = them ma, khong tao bang.
-- Du lieu nghiep vu luu Code; doi ten muc (NameVi/NameEn) khong lam hong du lieu cu.
--
-- Nguoi dung moi duoc API tu chep bo mac dinh o lan dau dung danh sach. Script nay chep san
-- cho nguoi DA co du lieu va chuyen doi thu chi (truoc day giao dich luu thang ten danh muc).

CREATE TABLE "LookupList" (
  "Id" varchar(36) NOT NULL,
  "OwnerId" text NOT NULL,
  "ListCode" varchar(40) NOT NULL,
  "Code" varchar(16) NOT NULL,
  "NameVi" varchar(80) NOT NULL,
  "NameEn" varchar(80) NOT NULL,
  "Color" varchar(7) NOT NULL,
  "Kind" varchar(8) NOT NULL,
  "SortOrder" integer NOT NULL,
  "FlagActive" boolean NOT NULL,
  "CreatedAt" timestamp with time zone NOT NULL,
  "UpdatedAt" timestamp with time zone NOT NULL,
  CONSTRAINT "PK_LookupList" PRIMARY KEY ("Id"),
  CONSTRAINT "FK_LookupList_AspNetUsers_OwnerId" FOREIGN KEY ("OwnerId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "IX_LookupList_OwnerId_ListCode_Code" ON "LookupList" ("OwnerId", "ListCode", "Code");
CREATE INDEX "IX_LookupList_OwnerId_ListCode_SortOrder" ON "LookupList" ("OwnerId", "ListCode", "SortOrder");

-- 1. Lich: ma mac dinh trung gia tri da luu (personal, work, todo, done...) nen su kien cu
--    khong phai doi gi. Chep cho moi nguoi da co su kien.
INSERT INTO "LookupList" ("Id", "OwnerId", "ListCode", "Code", "NameVi", "NameEn", "Color", "Kind", "SortOrder", "FlagActive", "CreatedAt", "UpdatedAt")
SELECT md5(random()::text || clock_timestamp()::text || o."OwnerId" || d.code), o."OwnerId", d.list, d.code, d.vi, d.en, d.color, '', d.sort, true, now(), now()
FROM (SELECT DISTINCT "OwnerId" FROM "PersonalCalendarEvent") o
CROSS JOIN (VALUES
  ('CALENDAR_CATEGORY', 'personal', 'Cá nhân', 'Personal', '#7661d8', 0),
  ('CALENDAR_CATEGORY', 'leisure', 'Đi chơi', 'Going out', '#d0764a', 1),
  ('CALENDAR_CATEGORY', 'routine', 'Sinh hoạt', 'Daily routine', '#3b9d86', 2),
  ('CALENDAR_CATEGORY', 'work', 'Công việc', 'Work', '#4d87c2', 3),
  ('CALENDAR_STATUS', 'todo', 'Cần làm', 'To do', '#6b6b7b', 0),
  ('CALENDAR_STATUS', 'in_progress', 'Đang làm', 'In progress', '#2f6fd6', 1),
  ('CALENDAR_STATUS', 'urgent', 'Khẩn cấp', 'Urgent', '#d33a42', 2),
  ('CALENDAR_STATUS', 'done', 'Đã hoàn thành', 'Done', '#23855c', 3),
  ('CALENDAR_STATUS', 'cancelled', 'Hủy bỏ', 'Cancelled', '#8a8a99', 4)
) AS d(list, code, vi, en, color, sort)
ON CONFLICT ("OwnerId", "ListCode", "Code") DO NOTHING;

-- 2. Thu chi: giao dich luu ma danh muc o cot moi CategoryCode. Cot Category (ten) giu lai
--    lam ban chup ten luc luu va de lui phien ban neu can.
ALTER TABLE "PersonalExpense" ADD COLUMN "CategoryCode" varchar(16) NOT NULL DEFAULT '';

-- 2a. 10 danh muc mac dinh cho moi nguoi da co giao dich hoac danh muc tu tao
INSERT INTO "LookupList" ("Id", "OwnerId", "ListCode", "Code", "NameVi", "NameEn", "Color", "Kind", "SortOrder", "FlagActive", "CreatedAt", "UpdatedAt")
SELECT md5(random()::text || clock_timestamp()::text || o."OwnerId" || d.code), o."OwnerId", 'EXPENSE_CATEGORY', d.code, d.vi, d.en, d.color, d.kind, d.sort, true, now(), now()
FROM (SELECT "OwnerId" FROM "PersonalExpense" UNION SELECT "OwnerId" FROM "PersonalExpenseCategory") o
CROSS JOIN (VALUES
  ('salary', 'Lương', 'Salary', '#23855c', 'income', 0),
  ('other_income', 'Thu nhập khác', 'Other income', '#3b9d86', 'income', 1),
  ('food', 'Ăn uống', 'Food & drinks', '#d0764a', 'expense', 2),
  ('transport', 'Đi lại', 'Transport', '#4d87c2', 'expense', 3),
  ('shopping', 'Mua sắm', 'Shopping', '#c2417a', 'expense', 4),
  ('bills', 'Hóa đơn', 'Bills', '#b7791f', 'expense', 5),
  ('housing', 'Nhà ở', 'Housing', '#7661d8', 'expense', 6),
  ('entertainment', 'Giải trí', 'Entertainment', '#2f9fb3', 'expense', 7),
  ('health', 'Sức khỏe', 'Health', '#d33a42', 'expense', 8),
  ('other', 'Khác', 'Other', '#6b6b7b', 'both', 9)
) AS d(code, vi, en, color, kind, sort)
ON CONFLICT ("OwnerId", "ListCode", "Code") DO NOTHING;

-- 2b. Danh muc tu tao (bang PersonalExpenseCategory cu). Loai Thu/Chi suy tu cach da dung:
--     chi dung cho khoan thu -> income, chi cho khoan chi -> expense, con lai -> both.
INSERT INTO "LookupList" ("Id", "OwnerId", "ListCode", "Code", "NameVi", "NameEn", "Color", "Kind", "SortOrder", "FlagActive", "CreatedAt", "UpdatedAt")
SELECT md5(random()::text || clock_timestamp()::text || c."Id"), c."OwnerId", 'EXPENSE_CATEGORY',
       'c' || substr(md5(c."Id"), 1, 10), c."Name", c."Name", '#6b6b7b',
       CASE
         WHEN EXISTS (SELECT 1 FROM "PersonalExpense" e WHERE e."OwnerId" = c."OwnerId" AND e."Category" = c."Name" AND e."Type" = 'income')
          AND NOT EXISTS (SELECT 1 FROM "PersonalExpense" e WHERE e."OwnerId" = c."OwnerId" AND e."Category" = c."Name" AND e."Type" = 'expense') THEN 'income'
         WHEN EXISTS (SELECT 1 FROM "PersonalExpense" e WHERE e."OwnerId" = c."OwnerId" AND e."Category" = c."Name" AND e."Type" = 'expense')
          AND NOT EXISTS (SELECT 1 FROM "PersonalExpense" e WHERE e."OwnerId" = c."OwnerId" AND e."Category" = c."Name" AND e."Type" = 'income') THEN 'expense'
         ELSE 'both'
       END,
       100 + row_number() OVER (PARTITION BY c."OwnerId" ORDER BY c."Name"), true, now(), now()
FROM "PersonalExpenseCategory" c
WHERE NOT EXISTS (SELECT 1 FROM "LookupList" l WHERE l."OwnerId" = c."OwnerId" AND l."ListCode" = 'EXPENSE_CATEGORY' AND l."NameVi" = c."Name")
ON CONFLICT ("OwnerId", "ListCode", "Code") DO NOTHING;

-- 2c. Phong truong hop giao dich mang ten danh muc khong con o dau ca: tao muc cho ten do
INSERT INTO "LookupList" ("Id", "OwnerId", "ListCode", "Code", "NameVi", "NameEn", "Color", "Kind", "SortOrder", "FlagActive", "CreatedAt", "UpdatedAt")
SELECT md5(random()::text || clock_timestamp()::text || x."OwnerId" || x."Category"), x."OwnerId", 'EXPENSE_CATEGORY',
       'c' || substr(md5(x."OwnerId" || '|' || x."Category"), 1, 10), x."Category", x."Category", '#6b6b7b', x.kind,
       200 + row_number() OVER (PARTITION BY x."OwnerId" ORDER BY x."Category"), true, now(), now()
FROM (
  SELECT e."OwnerId", e."Category",
         CASE WHEN bool_and(e."Type" = 'income') THEN 'income' WHEN bool_and(e."Type" = 'expense') THEN 'expense' ELSE 'both' END AS kind
  FROM "PersonalExpense" e
  WHERE NOT EXISTS (SELECT 1 FROM "LookupList" l WHERE l."OwnerId" = e."OwnerId" AND l."ListCode" = 'EXPENSE_CATEGORY' AND l."NameVi" = e."Category")
  GROUP BY e."OwnerId", e."Category"
) x
ON CONFLICT ("OwnerId", "ListCode", "Code") DO NOTHING;

-- 2d. Danh muc mac dinh tung bi dung "sai loai" (vd. Luong cho khoan chi) thi doi sang both,
--     de sua giao dich cu khong bi tu choi
UPDATE "LookupList" l SET "Kind" = 'both', "UpdatedAt" = now()
WHERE l."ListCode" = 'EXPENSE_CATEGORY' AND l."Kind" <> 'both'
  AND EXISTS (SELECT 1 FROM "PersonalExpense" e WHERE e."OwnerId" = l."OwnerId" AND e."Category" = l."NameVi" AND e."Type" <> l."Kind");

-- 2e. Gan ma danh muc cho moi giao dich cu theo ten
UPDATE "PersonalExpense" e SET "CategoryCode" = l."Code"
FROM "LookupList" l
WHERE l."OwnerId" = e."OwnerId" AND l."ListCode" = 'EXPENSE_CATEGORY' AND l."NameVi" = e."Category" AND e."CategoryCode" = '';
