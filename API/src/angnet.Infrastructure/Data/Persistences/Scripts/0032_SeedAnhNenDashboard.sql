-- Anh nen trang tong quan quan tri. Quan tri vien co the thay URL tai man
-- "Tham so he thong" ma khong can sua va deploy lai frontend.
INSERT INTO "SysParameter" (
    "ParameterCode", "ParameterNameVi", "ParameterNameEn",
    "ParameterValueVi", "ParameterValueEn", "DefaultValueVi", "DefaultValueEn",
    "DataType", "Category", "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'DASHBOARD_BACKGROUND_IMAGE',
    'Anh nen trang quan tri', 'Dashboard background image',
    'https://i.ytimg.com/vi/UiqJa6_PsIo/maxresdefault.jpg',
    'https://i.ytimg.com/vi/UiqJa6_PsIo/maxresdefault.jpg',
    'https://i.ytimg.com/vi/UiqJa6_PsIo/maxresdefault.jpg',
    'https://i.ytimg.com/vi/UiqJa6_PsIo/maxresdefault.jpg',
    'string', 'Dashboard',
    'URL anh nen hien thi tai trang tong quan quan tri',
    'Background image URL displayed on the dashboard overview',
    1, true, 'system', 'system', now(), now()
)
ON CONFLICT ("ParameterCode") DO NOTHING;
