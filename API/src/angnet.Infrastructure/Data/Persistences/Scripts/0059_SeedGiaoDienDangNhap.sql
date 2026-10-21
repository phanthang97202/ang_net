-- Một tham số JSON cho cả ảnh nền và mô tả bên trái trang đăng nhập.
-- Không ghi đè cấu hình đã được quản trị viên tạo trước đó.
INSERT INTO "SysParameter" (
    "ParameterCode", "ParameterNameVi", "ParameterNameEn",
    "ParameterValueVi", "ParameterValueEn", "DefaultValueVi", "DefaultValueEn",
    "DataType", "Category", "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'LOGIN_APPEARANCE', 'Giao diện trang đăng nhập', 'Login appearance',
    '{"image":"/assets/images/bg_banner.avif","description":"Nơi lưu lại những suy nghĩ, trải nghiệm và góc nhìn về công việc, sáng tạo và sự trưởng thành."}',
    '{"image":"/assets/images/bg_banner.avif","description":"A place for thoughts, experiences and perspectives on work, creativity and growing up."}',
    '{"image":"/assets/images/bg_banner.avif","description":"Nơi lưu lại những suy nghĩ, trải nghiệm và góc nhìn về công việc, sáng tạo và sự trưởng thành."}',
    '{"image":"/assets/images/bg_banner.avif","description":"A place for thoughts, experiences and perspectives on work, creativity and growing up."}',
    'json', 'Blog',
    'JSON gồm image (URL ảnh HTTP(S) hoặc đường dẫn /assets/...) và description (mô tả dạng chữ thuần). Value VI/EN theo ngôn ngữ trang. description rỗng để ẩn mô tả. Tắt hoạt động hoặc cấu hình lỗi sẽ dùng giao diện mặc định.',
    'JSON with image (HTTP(S) image URL or /assets/... path) and description (plain text). VI/EN values follow the page language. An empty description hides it. Inactive or invalid configuration falls back to the default appearance.',
    2, true, 'system', 'system', now(), now()
)
ON CONFLICT ("ParameterCode") DO NOTHING;
