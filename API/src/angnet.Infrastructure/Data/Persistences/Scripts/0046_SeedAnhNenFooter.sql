-- Anh nen footer; doi URL trong Tham so he thong, khong can deploy lai frontend.
-- De trong gia tri Vi va En de bo anh nen.
INSERT INTO "SysParameter" (
    "ParameterCode", "ParameterNameVi", "ParameterNameEn",
    "ParameterValueVi", "ParameterValueEn", "DefaultValueVi", "DefaultValueEn",
    "DataType", "Category", "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'FOOTER_BACKGROUND_IMAGE',
    'Ảnh nền chân trang', 'Footer background image',
    '/assets/images/bg_footer.png', '/assets/images/bg_footer.png',
    '/assets/images/bg_footer.png', '/assets/images/bg_footer.png',
    'string', 'Home',
    'URL ảnh nền footer (https://... hoặc /assets/...). Để trống cả giá trị Vi và En để bỏ ảnh nền.',
    'Footer background image URL (https://... or /assets/...). Clear both Vi and En values to remove the background.',
    8, true, 'system', 'system', now(), now()
)
ON CONFLICT ("ParameterCode") DO NOTHING;
