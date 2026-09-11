-- Danh muc san pham nuoc uong ban tai quay le tan va so luong nhap kho.
--
-- ParameterValueVi/En : mang JSON cac san pham
--   code    : ma san pham, la khoa noi voi cot ProductCode cua bang ShiftReportDrinkSale
--   name    : ten hien thi
--   unit    : don vi tinh (lon, chai...)
--   price   : don gia ban
--   stockIn : so luong nhap dau ky
--
-- Ton kho con lai KHONG luu trong tham so nay. API tinh:
--   con lai = stockIn - tong Quantity da ban trong bang ShiftReportDrinkSale.
-- Sua stockIn khi nhap them hang; doi code se lam mat lien ket voi lich su da ban.
INSERT INTO "SysParameter" (
    "ParameterCode", "ParameterNameVi", "ParameterNameEn",
    "ParameterValueVi", "ParameterValueEn", "DefaultValueVi", "DefaultValueEn",
    "DataType", "Category", "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'SHIFT_DRINK_STOCK',
    'Danh muc va ton kho nuoc uong', 'Drink catalogue and stock',
    '[{"code":"coca","name":"Coca Cola","unit":"lon","price":15000,"stockIn":100},{"code":"pepsi","name":"Pepsi","unit":"lon","price":15000,"stockIn":100},{"code":"redbull","name":"Bò húc","unit":"lon","price":20000,"stockIn":50},{"code":"water","name":"Nước lọc","unit":"chai","price":10000,"stockIn":200},{"code":"sting","name":"Sting","unit":"chai","price":15000,"stockIn":50},{"code":"beer-333","name":"Bia 333","unit":"lon","price":20000,"stockIn":50}]',
    '[{"code":"coca","name":"Coca Cola","unit":"can","price":15000,"stockIn":100},{"code":"pepsi","name":"Pepsi","unit":"can","price":15000,"stockIn":100},{"code":"redbull","name":"Red Bull","unit":"can","price":20000,"stockIn":50},{"code":"water","name":"Bottled water","unit":"bottle","price":10000,"stockIn":200},{"code":"sting","name":"Sting","unit":"bottle","price":15000,"stockIn":50},{"code":"beer-333","name":"333 Beer","unit":"can","price":20000,"stockIn":50}]',
    '[]', '[]',
    'json', 'ShiftReport',
    'Danh sach san pham nuoc uong va so luong nhap kho dau ky cho bao cao ca',
    'Drink products and opening stock quantities for the shift report',
    1, true, 'system', 'system', now(), now()
)
ON CONFLICT ("ParameterCode") DO NOTHING;
