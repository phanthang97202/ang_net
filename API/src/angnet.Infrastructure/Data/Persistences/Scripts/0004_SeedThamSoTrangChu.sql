-- Seed 4 tham so cau hinh trang chu (banner, gioi thieu, social, anh noi bat).
-- Gia tri dang JSON luu o ca ParameterValueVi va ParameterValueEn (client doc
-- theo ngon ngu hien tai, thieu En thi fallback Vi).
-- DefaultValue de rong ('[]' / '{}'): khi reset, client tu dung gia tri mac
-- dinh built-in nen khong can luu ban goc dai o day.
-- Dung dollar-quote ($j$...$j$) cho JSON de khoi phai escape dau nhay.
-- ON CONFLICT DO NOTHING: khong ghi de neu admin da tu tao truoc do.

INSERT INTO "SysParameter" (
    "ParameterCode", "ParameterNameVi", "ParameterNameEn",
    "ParameterValueVi", "ParameterValueEn", "DefaultValueVi", "DefaultValueEn",
    "DataType", "Category", "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES
(
    'HOME_BANNERS', 'Banner trang chu', 'Home banners',
    $j$[{"title":"Nhật Ký <span class='accent'>Sở Thích</span> Và Đời Thường","description":"Đây là góc nhỏ của Phan Thang — nơi lưu lại những sở thích, suy nghĩ và trải nghiệm cá nhân trong cuộc sống hằng ngày.","image":"/assets/images/bg_banner.avif","buttonText":"Khám phá bài viết","buttonLink":"/news"}]$j$,
    $j$[{"title":"Diary of <span class='accent'>Hobbies</span> and Everyday Life","description":"A little corner of Phan Thang — where hobbies, thoughts and personal experiences of everyday life are kept.","image":"/assets/images/bg_banner.avif","buttonText":"Explore posts","buttonLink":"/news"}]$j$,
    '[]', '[]',
    'json', 'Home', 'Danh sach banner slideshow o hero trang chu', 'Hero banner slideshow list',
    1, true, 'system', 'system', now(), now()
),
(
    'HOME_INTRO', 'Gioi thieu trang chu', 'Home intro',
    $j$ {"name":"Phan Thang","avatar":"https://res.cloudinary.com/dumdpgmgs/image/upload/v1784814350/IMG_20230128_191009_apuscf.jpg","shortDescription":"09h53 09-07-2002","description":"Phan Thang chia sẻ những suy nghĩ, trải nghiệm cuộc sống và góc nhìn cá nhân về công việc, sáng tạo và sự trưởng thành mỗi ngày.","address":"Hà Nam City"} $j$,
    $j$ {"name":"Phan Thang","avatar":"https://res.cloudinary.com/dumdpgmgs/image/upload/v1784814350/IMG_20230128_191009_apuscf.jpg","shortDescription":"09h53 09-07-2002","description":"Phan Thang shares thoughts, life experiences and a personal perspective on work, creativity and growing up every day.","address":"Ha Nam City"} $j$,
    '{}', '{}',
    'json', 'Home', 'Khoi gioi thieu tac gia o sidebar trang chu', 'Author intro block on home sidebar',
    2, true, 'system', 'system', now(), now()
),
(
    'SOCIAL_LINKS', 'Lien ket mang xa hoi', 'Social links',
    $j$ [{"icon":"facebook","link":"https://www.facebook.com/phanthang97202"},{"icon":"github","link":"https://github.com/phanthang97202"}] $j$,
    $j$ [{"icon":"facebook","link":"https://www.facebook.com/phanthang97202"},{"icon":"github","link":"https://github.com/phanthang97202"}] $j$,
    '[]', '[]',
    'json', 'Home', 'Danh sach mang xa hoi (dung o sidebar va footer)', 'Social links list (used on sidebar and footer)',
    3, true, 'system', 'system', now(), now()
),
(
    'HOME_FEATURED_IMAGES', 'Anh noi bat trang chu', 'Home featured images',
    $j$ [{"image":"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGftRBcqFNiokLou_wbwK9TTFsi01_MJsiIFce931rsiMDsxCCaN2bUA&s=10","caption":"GOAT 7"},{"image":"https://cdn-img.thethao247.vn/origin_640x0/storage/files/nhatbinh02112002/2026/05/29/anh-66-6a19a66910e99.jpg","caption":"09h53"},{"image":"https://static.bongda24h.vn/medias/standard/2016/7/11/vck-euro-2016-hinh-nhu-co-gi-do-sai-sai.jpg","caption":"EURO 2016"}] $j$,
    $j$ [{"image":"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGftRBcqFNiokLou_wbwK9TTFsi01_MJsiIFce931rsiMDsxCCaN2bUA&s=10","caption":"GOAT 7"},{"image":"https://cdn-img.thethao247.vn/origin_640x0/storage/files/nhatbinh02112002/2026/05/29/anh-66-6a19a66910e99.jpg","caption":"09h53"},{"image":"https://static.bongda24h.vn/medias/standard/2016/7/11/vck-euro-2016-hinh-nhu-co-gi-do-sai-sai.jpg","caption":"EURO 2016"}] $j$,
    '[]', '[]',
    'json', 'Home', 'Danh sach anh noi bat (slideshow o sidebar trang chu)', 'Featured images slideshow on home sidebar',
    4, true, 'system', 'system', now(), now()
)
ON CONFLICT ("ParameterCode") DO NOTHING;
