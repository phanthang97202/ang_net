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
    s."id",
    t."RoomNumber",
    t."InvoiceCode",
    t."CashAmount"
FROM "ShiftReport" AS s
INNER JOIN "ShiftReportTransaction" AS t
    ON s."id" = t."ShiftReportId"
WHERE t."CashAmount" > 0
  AND t."InvoiceCode" IS NOT NULL
  AND t."InvoiceCode" <> ''
  and s."ShiftDate" = '2025-10-31'
ORDER BY t."ShiftReportId" ASC;


