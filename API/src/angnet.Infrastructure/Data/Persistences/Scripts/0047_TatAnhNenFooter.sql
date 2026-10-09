-- Huy tinh nang anh nen footer. Giu gia tri cu de co the khoi phuc neu can.
-- Khong sua script 0046 vi script do co the da duoc chay tren production.
UPDATE "SysParameter"
SET "FlagActive" = false,
    "UpdatedBy" = 'system',
    "UpdatedDTime" = now()
WHERE "ParameterCode" = 'FOOTER_BACKGROUND_IMAGE';
