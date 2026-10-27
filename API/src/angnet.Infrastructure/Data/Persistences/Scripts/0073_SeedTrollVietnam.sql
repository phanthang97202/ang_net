-- Tro choi kham TROLL_VIETNAM: bat len thi moi URL blog tu chuyen ve /haha (dem nguoc
-- 3-2-1 -> BOOM -> hinh no tung -> cau choc gheo). /dashboard/* luon dung binh thuong
-- de chu web vao tat duoc. Thu tu uu tien: BLOG_MAINTENANCE > TROLL_VIETNAM > ONLY_SHIFT_REPORT.
--
-- Gia tri la JSON (dung ban tieng Viet, rong moi lay tieng Anh):
--   enabled          true/false - bat tat
--   message          cau hien giua man hinh (toi da 200 ky tu)
--   countdown        so giay dem nguoc, 1-10 (mac dinh 3)
--   images           toi da 12 phan tu, moi phan tu la link anh PNG nen trong suot hoac 1 emoji
--   excludedUserIds  userId khong bi troll (lay o /dashboard/users -> "Sao chep ID")
-- JSON sai cu phap coi nhu tat. Mac dinh enabled=false nen deploy xong web van binh thuong.
INSERT INTO "SysParameter" (
    "ParameterCode", "ParameterNameVi", "ParameterNameEn",
    "ParameterValueVi", "ParameterValueEn", "DefaultValueVi", "DefaultValueEn",
    "DataType", "Category", "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'TROLL_VIETNAM', 'Trò chơi khăm (troll)', 'Prank mode',
    '{"enabled":false,"message":"Haha, mày là 1 tên hề!","countdown":3,"images":["😂","🖕","🤡"],"excludedUserIds":[]}',
    '{"enabled":false,"message":"Haha, mày là 1 tên hề!","countdown":3,"images":["😂","🖕","🤡"],"excludedUserIds":[]}',
    '{"enabled":false,"message":"Haha, mày là 1 tên hề!","countdown":3,"images":["😂","🖕","🤡"],"excludedUserIds":[]}',
    '{"enabled":false,"message":"Haha, mày là 1 tên hề!","countdown":3,"images":["😂","🖕","🤡"],"excludedUserIds":[]}',
    'json', 'Blog',
    'enabled=true: mọi trang blog chuyển về /haha (đếm ngược, BOOM, hình nổ tung, câu chọc ghẹo). message: câu hiển thị; countdown: số giây đếm ngược (1-10); images: link ảnh PNG nền trong suốt hoặc emoji (tối đa 12); excludedUserIds: userId không bị troll (lấy ở /dashboard/users, nút "Sao chép ID"). /dashboard/* luôn truy cập bình thường. Giá trị tiếng Việt là chuẩn.',
    'enabled=true redirects every blog page to /haha (countdown, BOOM, exploding images, a teasing message). message: text shown; countdown: seconds (1-10); images: transparent PNG URLs or emoji (max 12); excludedUserIds: user ids that are never trolled (copy them from /dashboard/users). /dashboard/* always stays reachable. The Vietnamese value is canonical.',
    3, true, 'system', 'system', now(), now()
)
ON CONFLICT ("ParameterCode") DO NOTHING;
