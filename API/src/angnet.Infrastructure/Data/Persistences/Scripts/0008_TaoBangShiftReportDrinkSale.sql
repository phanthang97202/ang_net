-- Dich vu ban nuoc trong ca truc: luu vet tung lan ban de doi chieu ton kho.
--
-- Danh muc san pham + so luong NHAP kho nam o tham so he thong SHIFT_DRINK_STOCK
-- (JSON). Ton con lai KHONG luu o dau ca, ma tinh = stockIn - SUM(Quantity) tren
-- bang nay. Lam vay thi sua/xoa bao cao ca la ton kho tu dung lai, va hai le tan
-- luu cung luc cung khong ghi de len nhau.
--
-- ProductName/UnitPrice duoc chup lai tai thoi diem ban, khong tra nguoc tham so
-- luc xem bao cao: sau nay doi ten hay tang gia thi bao cao cu van giu dung gia
-- da ban. ProductCode la khoa bat bien de doi chieu voi tham so.
CREATE TABLE "ShiftReportDrinkSale" (
    "Id" integer GENERATED ALWAYS AS IDENTITY,
    "ShiftReportId" integer NOT NULL,
    "ProductCode" character varying(50) NOT NULL,
    "ProductName" character varying(100) NOT NULL,
    "Unit" character varying(20) NOT NULL,
    "Quantity" integer NOT NULL,
    "UnitPrice" numeric(18,2) NOT NULL,
    "PaymentMethod" character varying(20) NOT NULL,
    "FlagActive" boolean NOT NULL,
    "CreatedBy" text NOT NULL,
    "UpdatedBy" text NOT NULL,
    "CreatedDTime" timestamp with time zone NOT NULL,
    "UpdatedDTime" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_ShiftReportDrinkSale" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_ShiftReportDrinkSale_ShiftReport_ShiftReportId" FOREIGN KEY ("ShiftReportId") REFERENCES "ShiftReport" (id) ON DELETE CASCADE
);

-- Load bao cao ca luon keo theo cac dong ban nuoc cua no
CREATE INDEX "IX_ShiftReportDrinkSale_ShiftReportId" ON "ShiftReportDrinkSale" ("ShiftReportId");

-- Tinh ton kho phai cong don Quantity theo tung ProductCode tren toan bo lich su
CREATE INDEX "IX_ShiftReportDrinkSale_ProductCode" ON "ShiftReportDrinkSale" ("ProductCode");
