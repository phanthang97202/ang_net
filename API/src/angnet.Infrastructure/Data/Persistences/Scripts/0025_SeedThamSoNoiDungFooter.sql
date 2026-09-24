-- Noi dung thuong hieu footer theo tung ngon ngu.
-- Gia tri la JSON gom brandName, brandAccent, tagline va copyright.
-- Trong copyright co the dung {year}; client se tu thay bang nam hien tai.
INSERT INTO "SysParameter" (
    "ParameterCode", "ParameterNameVi", "ParameterNameEn",
    "ParameterValueVi", "ParameterValueEn", "DefaultValueVi", "DefaultValueEn",
    "DataType", "Category", "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'FOOTER_CONTENT',
    'Noi dung chan trang', 'Footer content',
    $j${"brandName":"Phan","brandAccent":"Thang","tagline":"Góc nhỏ ghi lại những chuyến đi, khoảnh khắc đời thường và những câu chuyện thật của Phan Thang.","copyright":"© {year} — Phan Thang. Đã đăng ký bản quyền."}$j$,
    $j${"brandName":"Phan","brandAccent":"Thang","tagline":"A little corner for journeys, everyday moments, and true stories from Phan Thang.","copyright":"© {year} — Phan Thang. All Rights Reserved."}$j$,
    '{}', '{}',
    'json', 'Home',
    'Noi dung logo, mo ta va ban quyen o chan trang; ho tro bien {year}',
    'Footer logo, tagline and copyright content; supports the {year} placeholder',
    6, true, 'system', 'system', now(), now()
)
ON CONFLICT ("ParameterCode") DO NOTHING;
