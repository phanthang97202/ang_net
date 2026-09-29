-- Danh sach danh muc hien trong khoi "Kham pha cac chu de hot".
-- Thu tu phan tu trong mang JSON chinh la thu tu hien thi ngoai trang chu.
-- ID khong ton tai hoac danh muc inactive se duoc bo qua.
INSERT INTO "SysParameter" (
    "ParameterCode", "ParameterNameVi", "ParameterNameEn",
    "ParameterValueVi", "ParameterValueEn", "DefaultValueVi", "DefaultValueEn",
    "DataType", "Category", "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'HOME_HOT_TOPIC_CATEGORY_IDS',
    'Danh muc chu de hot trang chu', 'Home hot topic categories',
    '["music","chinese_lang","news","code","film","girl","holiday","travel","cuisine"]',
    '["music","chinese_lang","news","code","film","girl","holiday","travel","cuisine"]',
    '["music","chinese_lang","news","code","film","girl","holiday","travel","cuisine"]',
    '["music","chinese_lang","news","code","film","girl","holiday","travel","cuisine"]',
    'json', 'Home',
    'Mang NewsCategoryId; thu tu phan tu quyet dinh thu tu hien thi',
    'NewsCategoryId array; item order controls display order',
    7, true, 'system', 'system', now(), now()
)
ON CONFLICT ("ParameterCode") DO NOTHING;
