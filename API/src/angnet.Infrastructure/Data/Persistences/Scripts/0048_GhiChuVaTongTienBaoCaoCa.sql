-- Ghi chu ban giao ca, bao cao cu mac dinh de trong.
ALTER TABLE "ShiftReport"
    ADD COLUMN "HandoverNote" character varying(2000) NOT NULL DEFAULT '';

-- Tinh lai tu chi tiet, khong tru tien dich vu tren tong cu (tong cu co the
-- da duoc tinh theo nhieu phien ban khac nhau). Khong thay doi giao dich.
WITH totals AS (
    SELECT report.id,
        COALESCE(tx.cash, 0) AS cash,
        COALESCE(tx.transfer, 0) AS transfer,
        COALESCE(tx.expense, 0) AS expense,
        COALESCE(drink.cash, 0) AS drink_cash
    FROM "ShiftReport" report
    LEFT JOIN (
        SELECT "ShiftReportId", SUM("CashAmount") AS cash,
            SUM("TransferAmount") AS transfer, SUM("ExpenseAmount") AS expense
        FROM "ShiftReportTransaction"
        GROUP BY "ShiftReportId"
    ) tx ON tx."ShiftReportId" = report.id
    LEFT JOIN (
        SELECT "ShiftReportId", SUM("Quantity" * "UnitPrice") AS cash
        FROM "ShiftReportDrinkSale"
        WHERE "PaymentMethod" = 'Tiền mặt'
        GROUP BY "ShiftReportId"
    ) drink ON drink."ShiftReportId" = report.id
)
UPDATE "ShiftReport" AS report
SET "TotalCash" = totals.cash,
    "TotalTransfer" = totals.transfer,
    "TotalExpense" = totals.expense,
    "HandoverAmount" = totals.cash + totals.drink_cash - totals.expense
FROM totals
WHERE totals.id = report.id;
