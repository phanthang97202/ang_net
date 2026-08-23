-- Danh sach bai hat cho trinh phat nhac o banner trang chu.
-- Truoc day 4 thong tin bai hat bi hardcode trong discovery-banner.component.html.
--
-- ParameterValueVi/En : mang JSON cac bai hat (id, title, artist, albumArt, audioSrc).
-- DefaultValueVi/En   : id cua bai mac dinh, phai khop mot phan tu trong mang.
--                       Sai id hoac de trong thi client tu lay bai dau danh sach.
INSERT INTO "SysParameter" (
    "ParameterCode", "ParameterNameVi", "ParameterNameEn",
    "ParameterValueVi", "ParameterValueEn", "DefaultValueVi", "DefaultValueEn",
    "DataType", "Category", "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'HOME_MUSIC',
    'Danh sach nhac trang chu', 'Home page playlist',
    '[{"id":"moi-duyen-vang","title":"Mối duyên vàng","artist":"Tuấn Cry, Võ Thu Hà","albumArt":"assets/images/moi_duyen_vang.webp","audioSrc":"assets/music/moi_duyen_vang.mp3"},{"id":"mua-tuyet","title":"Mưa tuyết","artist":"Jimmy Nguyễn","albumArt":"https://vnn-imgs-a1.vgcloud.vn/img.infonet.vn/w490/Uploaded/2020/iftqd/2014_02_18/images894605_tuyet_roi_sapa_1.jpg?width=260&s=HxajkPymU0vCIP2YIWudbA","audioSrc":"https://res.cloudinary.com/dumdpgmgs/video/upload/v1787501770/mua_tuyet_eek59x.mp3"}]',
    '[{"id":"moi-duyen-vang","title":"Mối duyên vàng","artist":"Tuấn Cry, Võ Thu Hà","albumArt":"assets/images/moi_duyen_vang.webp","audioSrc":"assets/music/moi_duyen_vang.mp3"},{"id":"mua-tuyet","title":"Mưa tuyết","artist":"Jimmy Nguyễn","albumArt":"https://vnn-imgs-a1.vgcloud.vn/img.infonet.vn/w490/Uploaded/2020/iftqd/2014_02_18/images894605_tuyet_roi_sapa_1.jpg?width=260&s=HxajkPymU0vCIP2YIWudbA","audioSrc":"https://res.cloudinary.com/dumdpgmgs/video/upload/v1787501770/mua_tuyet_eek59x.mp3"}]',
    'moi-duyen-vang', 'moi-duyen-vang',
    'json', 'Home',
    'Danh sach bai hat cho trinh phat nhac o banner trang chu',
    'Playlist for the home page banner music player',
    5, true, 'system', 'system', now(), now()
)
ON CONFLICT ("ParameterCode") DO NOTHING;
