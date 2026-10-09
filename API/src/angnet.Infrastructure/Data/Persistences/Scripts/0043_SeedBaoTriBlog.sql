INSERT INTO "SysParameter" (
    "ParameterCode", "ParameterNameVi", "ParameterNameEn",
    "ParameterValueVi", "ParameterValueEn", "DefaultValueVi", "DefaultValueEn",
    "DataType", "Category", "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'BLOG_MAINTENANCE', 'Bảo trì web blog', 'Blog maintenance',
    'false', 'false', 'false', 'false', 'bool', 'Blog',
    'true: chuyển các trang blog về /maintain; false: hoạt động bình thường. /dashboard/* luôn giữ truy cập theo quyền. Dùng cùng giá trị Vi/En.',
    'true redirects blog pages to /maintain; false enables normal operation. /dashboard/* retains normal authorization. Use identical Vi/En values.',
    1, true, 'system', 'system', now(), now()
)
ON CONFLICT ("ParameterCode") DO NOTHING;
