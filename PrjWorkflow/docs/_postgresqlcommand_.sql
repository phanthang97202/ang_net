SELECT * FROM public."ShiftReportTransaction"
ORDER BY "Id" ASC 

SELECT "ContentBody" FROM public."News"
where "ShortTitle" = 'Video'
ORDER BY "NewsId" ASC 

-- ===========

select  *  from "AspNetUsers"
select * from "MstTenantContacts"
select * from "Tenants"

-- Revenue
SELECT * FROM public."ShiftReport" 
where "CreatedDTime" > '2025-11-01'
order by "CreatedDTime" ASC

SELECT * FROM public."ShiftReportTransaction" 
where "CreatedDTime" > '2025-11-01'
order by "CreatedDTime" ASC

SELECT 
    s."ShiftDate",
	s."ShiftType",
    s."id",
    t."RoomNumber",
    t."InvoiceCode",
    t."CashAmount",
	t."TransferAmount"
FROM "ShiftReport" AS s
INNER JOIN "ShiftReportTransaction" AS t
    ON s."id" = t."ShiftReportId"
WHERE (1=1)
	
  AND s."ShiftType" = 'Ca ngày'
  AND t."TransferAmount" IS NULL
  AND t."InvoiceCode" IS NOT NULL
  AND t."InvoiceCode" <> ''
  and s."ShiftDate" = '2025-11-08'
ORDER BY t."ShiftReportId" ASC;

update "ShiftReportTransaction" set "TransferAmount" = 590000 where (1=1) AND "InvoiceCode" = '7081'
update "ShiftReportTransaction" set "TransferAmount" = 260000 where (1=1) AND "InvoiceCode" = '7093'
update "ShiftReportTransaction" set "TransferAmount" = 260000 where (1=1) AND "InvoiceCode" = '7095'
update "ShiftReportTransaction" set "TransferAmount" = 260000 where (1=1) AND "InvoiceCode" = '7097'
update "ShiftReportTransaction" set "TransferAmount" = 260000 where (1=1) AND "InvoiceCode" = '7096'
update "ShiftReportTransaction" set "TransferAmount" = 350000 where (1=1) AND "InvoiceCode" = '7092'
select * from "ShiftReportTransaction" where "InvoiceCode" = '7091'
update "ShiftReportTransaction" set "TransferAmount" = 350000 where (1=1) AND "InvoiceCode" = '7089'
update "ShiftReportTransaction" set "TransferAmount" = 350000 where (1=1) AND "InvoiceCode" = '7090'
update "ShiftReportTransaction" set "TransferAmount" = 350000 where (1=1) AND "InvoiceCode" = '7091'
update "ShiftReportTransaction" set "TransferAmount" = 460000 where (1=1) AND "InvoiceCode" = '7083'
update "ShiftReportTransaction" set "TransferAmount" = 350000 where (1=1) AND "InvoiceCode" = '7088'
update "ShiftReportTransaction" set "TransferAmount" = 260000 where (1=1) AND "InvoiceCode" = '7094'

