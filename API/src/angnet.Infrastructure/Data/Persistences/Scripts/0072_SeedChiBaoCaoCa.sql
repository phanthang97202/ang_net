-- Che do "chi bao cao ca truc": bat len thi blog chi con trang /tools/shift-report
-- (kem /login, /forgot-password de dang nhap). Moi URL blog khac tu chuyen ve bao
-- cao ca; /dashboard/* van dung binh thuong theo quyen. BLOG_MAINTENANCE uu tien
-- hon neu ca hai cung bat. Mac dinh false nen deploy xong blog van chay binh thuong.
INSERT INTO "SysParameter" (
    "ParameterCode", "ParameterNameVi", "ParameterNameEn",
    "ParameterValueVi", "ParameterValueEn", "DefaultValueVi", "DefaultValueEn",
    "DataType", "Category", "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'ONLY_SHIFT_REPORT', 'Chỉ mở báo cáo ca trực', 'Shift report only',
    'false', 'false', 'false', 'false', 'bool', 'Blog',
    'true: blog chỉ còn trang /tools/shift-report (và trang đăng nhập), mọi đường dẫn khác tự chuyển về báo cáo ca; false: hoạt động bình thường. /dashboard/* luôn giữ truy cập theo quyền. Người đã đăng nhập nhưng không có quyền báo cáo ca sẽ thấy trang bảo trì. Dùng cùng giá trị Vi/En.',
    'true limits the blog to /tools/shift-report (plus login); every other blog URL redirects to the shift report; false enables normal operation. /dashboard/* retains normal authorization. Signed-in users without the shift report permission see the maintenance page. Use identical Vi/En values.',
    2, true, 'system', 'system', now(), now()
)
ON CONFLICT ("ParameterCode") DO NOTHING;
