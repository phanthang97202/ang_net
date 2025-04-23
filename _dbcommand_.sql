insert into MstProvinces values 
('90HANAM2', 'Hà Nam', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

select count(*) from MstProvinces
select * from MstProvinces where CreatedDTime > '2024-12-07'
delete from MstProvinces where CreatedDTime > '2024-12-07'

select * from AspNetUsers where id = "9d430ca5-5214-4be5-b68f-ff1214c189ca"
select * from AspNetUserRoles
select * from AspNetRoles
select * from chat
delete from Chat where MessageId = '2a157142-7a67-41c3-a337-5db73909c92f'  UserId  = 'anhduong@gmail.com' or UserId = 'phanthang@gmail.com'
update  chat set Message = 'https://i.pinimg.com/736x/f1/58/14/f15814f88258c133540f9e914499364d.jpg'  where MessageId = 'test11'
insert into chat values 
('test11', '2024-10-01 23:30:52.0811634', '2024-10-10 23:30:52.0811634', 'admin@gmail.com', 'jpg')

insert into NewsCategory values 
('anime', '', 'Anime', 1, 1, '2024-10-10 23:30:52.0811634', '2024-10-10 23:30:52.0811634')

insert into NewsCategory values 
('film', '', 'Film', 0, 3, '2024-10-10 23:30:52.0811634', '2024-10-10 23:30:52.0811634')

insert into NewsCategory values 
('sport', '', 'Sport', 1, 4, '2024-10-10 23:30:52.0811634', '2024-10-10 23:30:52.0811634')

insert into NewsCategory values 
('girl-collection', '', 'Anime', 1, 1, '2024-10-10 23:30:52.0811634', '2024-10-10 23:30:52.0811634')

insert into NewsCategory values 
('comedy3', '2024-10-10 23:30:52.0811634', 1, 5, 'Comedy 3', 'comedy', '2024-10-23 23:30:52.0811634')

delete from NewsCategory where NewsCategoryId = 'sport'

insert into News values 
('toga', '9d430ca5-5214-4be5-b68f-ff1214c189ca', 'anime', 'toga', '', '', '', '<p>Thang</p>', '2024-10-10 23:30:52.0811634', '2024-10-10 23:30:52.0811634', 1, 0, 0, 0, 0, '', '')

update News  
set ContentBody = '"<h3><strong style=\"background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);\">Quirk và kh? n?ng ??c bi?t c?a Toga Himiko</strong></h3><ul><li><strong style=\"background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);\">Quirk: Transform:</strong><span style=\"background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);\"> Kh? n?ng bi?n ??i ngo?i hình và máu thành c?a ng??i khác b?ng cách u?ng máu c?a h?.</span></li><li><strong style=\"background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);\">?u ?i?m:</strong><span style=\"background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);\"> Linh ho?t trong chi?n ??u, kh? n?ng ng?y trang hoàn h?o, có th? s? d?ng s?c m?nh c?a nh?ng ng??i mà cô ?ã bi?n ??i.</span></li><li><strong style=\"background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);\">H?n ch?:</strong><span style=\"background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);\"> C?n ph?i u?ng máu th??ng xuyên ?? duy trì bi?n ??i, có th? b? m?t ki?m soát khi u?ng quá nhi?u máu.</span></li></ul><p></p><p></p><p>Tác gi?: PHan Thang</p>"' 
where NewsId = 'toga'

insert into MstStadiumStatuses values
('P', 'Pending', 1, '2024-10-23 23:31:52.0811634', '2024-10-23 23:31:52.0811634')

insert into MstStadiumStatuses values
('F', 'Fixing', 1, '2024-10-23 23:32:52.0811634', '2024-10-23 23:32:52.0811634')

insert into MstStadiumStatuses values
('U', 'Using', 1, '2024-10-23 23:33:52.0811634', '2024-10-23 23:33:52.0811634')

insert into MstStadiumStatuses values
('D', 'Detroy', 1, '2024-10-23 23:34:52.0811634', '2024-10-23 23:34:52.0811634')

// select * from MstStadiumTypes
insert into MstStadiumTypes values
('FUTSAL_STADIUM', 'Futsal stadium', 350000, 0, 2, 1, '2024-10-23 23:35:52.0811634', '2024-10-23 23:35:52.0811634')

insert into MstStadiumTypes values
('ARTIFICIAL_FOOTBALL_STADIUM_SIZE_5', 'Artificial football stadium (5vs5)', 250000, 0, 5, 1, '2024-10-23 23:36:52.0811634', '2024-10-23 23:36:52.0811634')

insert into MstStadiumTypes values
('ARTIFICIAL_FOOTBALL_STADIUM_SIZE_7', 'Artificial football stadium (7vs7)', 300000, 0, 3, 1, '2024-10-23 23:37:52.0811634', '2024-10-23 23:37:52.0811634')

insert into MstStadiumTypes values
('NATURAL_GRASS_STADIUM_SIZE_11', 'Natural grass stadium (11vs11)', 20000000, 0, 2, 1, '2024-10-23 23:38:52.0811634', '2024-10-23 23:38:52.0811634')

-- dành cho sql server
UPDATE MstStadiumTypes t
JOIN MstStadiumTypes a ON a.StadiumTypeCode = t.StadiumTypeCode
SET t.StadiumTypeSale = a.StadiumTypePrice;

-- dành cho sqlite
WITH temp AS (
    SELECT StadiumTypeCode, StadiumTypePrice 
    FROM MstStadiumTypes
)
UPDATE MstStadiumTypes 
SET StadiumTypeSale = (SELECT StadiumTypePrice FROM temp WHERE temp.StadiumTypeCode = MstStadiumTypes.StadiumTypeCode);




// select * from MstStadiums
insert into MstStadiums values
(
        'SANTIAGO_BERNABEU_STD', -- StadiumCode
        '2024-10-23 23:35:52.0811634', -- CreatedDTime
        1, -- FlagActive
        0, -- FlagSale
        0, -- FlagStadiumRent
        'randomid1', -- Id
        'Av. de Concha Espina, 1, Chamartín, 28036 Madrid, Spain', -- StadiumAddress
        '<p>The only official ticket sales channels are www.realmadrid.com and www.entradas.com</p>', -- StadiumDescription
        '90_LyNhan', -- StadiumDistrictCode
        'Santiago Bernabeu Stadium', -- StadiumName
        200000000, -- StadiumPrice
        '2024-11-23 20:00:52.0811634', -- StadiumRentDTimeFrom
        '2024-11-23 21:45:52.0811634', -- StadiumRentDTimeTo
        200000000, -- StadiumSalePrice
        'P', -- StadiumStatusCode
        'NATURAL_GRASS_STADIUM_SIZE_11', -- StadiumTypeCode
        '2024-10-23 23:35:52.0811634' -- UpdatedDTime
)


// select * from MstDistricts
// select * from MstProvinces
// delete from MstStadiums where StadiumCode = 'SANTIAGO_BERNABEU_STD'

SELECT *
FROM OrderStadiums
WHERE StadiumCode NOT IN (SELECT StadiumCode FROM MstStadiums);

SELECT *
FROM OrderStadiums
WHERE PaymentTypeCode NOT IN (SELECT PaymentTypeCode FROM MstPaymentTypes);

SELECT *
FROM OrderStadiums
WHERE UserId NOT IN (SELECT Id FROM AspNetUsers);

PRAGMA foreign_keys = on;

PRAGMA foreign_key_list(MstStadiums);

drop table mstdistricts
drop table mststadiums
drop table 
PRAGMA index_list('MstStadiums');

drop database auth

select * from mstdistricts

insert into MstDistricts values
(
        '90', -- ProvinceCode
        '90_LyNhan', -- DistrictCode
        'Lý Nhân', -- DistrictName
        1, -- FlagActive
        '2024-10-23 23:35:52.0811634', -- CreatedDTime
        '2024-10-23 23:35:52.0811634' -- UpdatedDTime
)

select * from NewsCategory
select * from News order by CreatedDTime desc
select * from HashTagNews
select * from RefFileNews
select * from PointNews

delete from News where NewsId  like 'tourism-new-zealand-website'
delete from HashTagNews where NewsId  like '%white-queen-%'

delete from News where newsid = 'stain-hero-killer' or newsid = 'stain-hero-killer-3'
delete from HashTagNews

insert into HashTagNews values 
('Mukuro', '2024-10-10 23:30:52.0811634', true, 'Mukuro', 'mukuro-hoshimiya-is-the-tenth-spirit-to-appea', '2024-10-10 23:30:52.0811634'),
('DateALive', '2024-10-10 23:30:52.0811634', true, 'DateALive', 'mukuro-hoshimiya-is-the-tenth-spirit-to-appea', '2024-10-10 23:30:52.0811634')

insert into PointNews values 
('stain-hero-killer', '99841345-efbb-4b47-ad3c-cb60ad73e4e0', '2024-10-10 23:30:52.0811634', 1, 8.9, '2024-10-10 23:30:52.0811634')
insert into PointNews values 
('stain-hero-killer', '502871db-e932-4894-8d74-69beb5aecd73', '2024-10-10 23:30:52.0811634', 1, 8, '2024-10-10 23:30:52.0811634')

select n.NewsId, r.FileUrl, h.HashTagNewsName, p.Point, Sum(p.Point)  as AvgPoint 
from News n
left join RefFileNews r on n.NewsId = r.NewsId  
left join HashTagNews h on n.NewsId = h.NewsId
left join PointNews p on n.NewsId = p.NewsId
group by n.NewsId, r.FileUrl, h.HashTagNewsName, p.Point
having n.NewsId = 'stain-hero-killer'

delete from LikeNews where NewsId = 'stain-hero-killer'
delete from PointNews where NewsId = 'stain-hero-killer' and UserId = '9d430ca5-5214-4be5-b68f-ff1214c189ca'

select * from AspNetUsers 
update AspNetUsers 
set  Address = 'Lý Nhân, Hà Nammmm'
where Id = '99841345-efbb-4b47-ad3c-cb60ad73e4e0'

update AspNetUsers 
set  Address = 'Vi?t Nam', Avatar = 'https://i.pinimg.com/736x/64/d9/41/64d941e13f7d98a48d5715f9b9a90ad3.jpg'
where Id = '97af4168-06ee-4dd3-8221-fec59905008b'

update AspNetUsers 
set  Address = 'Vi?t Nam', Avatar = 'https://i.pinimg.com/736x/e3/2d/99/e32d99170bf74d9d517a8a87437f72ab.jpg'
where Id = '2faff826-8ba0-4fed-a42e-524bf9739955'

update AspNetUsers 
set  Address = 'Vi?t Nam', Avatar = 'https://i.pinimg.com/736x/23/fa/06/23fa06525e01594284073280dafe8610.jpg'
where Id = 'aaf6d38e-affe-4eb9-97a0-9f6989dcf7a0'


SELECT DISTINCT NewsId FROM HashTagNews WHERE NewsId NOT IN (SELECT NewsId FROM News);
DELETE FROM HashTagNews WHERE NewsId NOT IN (SELECT NewsId FROM News);


select * from RefreshTokens
delete from RefreshTokens
update RefreshTokens set IsRevoked = '1' where RefreshToken = '079edd42-2108-4bcb-b10d-9e3a9c439d67'

update News set Thumbnail = 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/e8/f4/fa/e8f4fa94-53ce-0214-7113-f09c8464e5ca/mza_17326581670512848585.jpg/300x300bb.webp' where NewsId = 'learning-about-culture'

select n.UserId, a.Email, count(n.NewsId) as SoLuongBaiViet
from News n
inner join AspNetUsers a
        on n.UserId = a.Id
group by n.UserId
having n.ViewCount > 5

-------------------------------
select distinct a.Email, n.ShortTitle
from News n
inner join AspNetUsers a
        on n.UserId = a.Id 
order by a.Email asc, n.ShortTitle asc

---------------
-- L?nh GROUP BY ho?t ??ng nh? th? nào? Có th? dùng v?i WHERE ???c không?

--1? FROM ? Ch?n b?ng d? li?u.
--2 WHERE ? L?c d? li?u thô (ch? l?c d?a trên c?t g?c, ch?a có t?ng h?p).
--3? GROUP BY ? Nhóm các dòng có cùng giá tr?.
--4? Tính toán Aggregate (COUNT(), SUM(), AVG(), …).
--5? HAVING ? L?c d? li?u sau khi nhóm.
--6? ORDER BY ? S?p x?p k?t qu? cu?i cùng.
 
select sum(ViewCount)
from News
where LikeCount = 0
group by UserId
 
----
SELECT Country, COUNT(*) AS TotalCustomers  
FROM Customers  
GROUP BY Country  
WHERE COUNT(*) > 5;  -- ? L?I: COUNT(*) ch?a t?n t?i ? b??c này

------------------
select  a.Email, n.ShortTitle
from AspNetUsers a
left join News n 
        on n.UserId = a.Id 
order by a.Email asc, n.ShortTitle asc

------------------
select a.Email, n.ShortTitle
from News n
right join AspNetUsers a 
        on n.UserId = a.Id 
order by a.Email asc, n.ShortTitle asc

------------------
select  a.Email, n.ShortTitle
from AspNetUsers a
full join News n 
        on n.UserId = a.Id 
order by a.Email asc, n.ShortTitle asc

-----------------------------------------------------------
-- ******Khi nào nên s? d?ng subquery thay vì JOIN?****
--- 1. Khi ch? c?n l?y m?t giá tr? c? th?'
select 
        (select a.Email from AspNetUsers a where n.UserId = a.Id) Email,
        n.ShortTitle
from News n

--- 2. Khi ch? quan tâm ??n d? li?u có ?i?u ki?n c? th?
select ShortTitle 
from News
where UserId in (select Id from AspNetUsers where Email = 'admin@gmail.com')

--- 3. Khi tránh trùng l?p d? li?u do JOIN gây ra
select n.ShortTitle,
       (select count(*) 
        from PointNews p 
        where p.NewsId = n.NewsId) as CountAudianceAppreciate
from News n

--- 4. Khi không c?n dùng d? li?u t? b?ng khác trong m?nh ?? SELECT
--- N?u b?ng ph? ch? c?n dùng ?? ki?m tra ?i?u ki?n (EXISTS, IN), thì subquery t?t h?n JOIN.
select a.Email 
from AspNetUsers a
where not exists (select n.UserId 
                  from News n
                  where a.Id = n.UserId) 
                  
---***** Làm th? nào ?? tìm các giá tr? trùng l?p trong m?t c?t? *****
select n.ViewCount, count(*) as NumberApprerience
from News n
group by n.ViewCount
having count(*) > 1
order by n.ViewCount asc

-- lam sao de lay hang co gia tri lon thu n trong SQL
-- TH1: lay rank bao gom ca truong hop trung rank
select * 
from (
        select n.ShortTitle, dense_rank() over(order by n.ViewCount) as ranking
        from News n
        ) as _News 
where ranking = 2

-- TH2: lay chinh xac rank
select news.NewsId
from news
order by news.ViewCount
limit 1
offset 2 -- offset runs before limit

-- lam the nao de tim cac ban ghi khong khop o cac bang khac 
select a.Email, n.ShortTitle
from News n
right join AspNetUsers a 
        on n.UserId = a.Id 
where n.ShortTitle is null
order by a.Email asc, n.ShortTitle asc

-- so sanh su khac nhau giua in va exists
--Tiêu chí                 IN                                                      EXISTS
--Cách ho?t ??ng           Ki?m tra m?t giá tr? có n?m trong danh sách hay không   Ki?m tra xem có dòng nào t?n t?i hay không
--Th?c thi                 L?y toàn b? k?t qu? t? subquery tr??c khi so sánh       D?ng ngay khi tìm th?y k?t qu? ??u tiên
--Hi?u su?t t?t nh?t khi   D? li?u nh? (t?p h?p con có ít b?n ghi)                 D? li?u l?n (ch? c?n ki?m tra s? t?n t?i)
--Khi subquery tr? v? NULL Có th? gây l?i ho?c b? qua t?t c?                       Không ?nh h??ng

-- case trong sql
select n.NewsId, n.ViewCount,
       case 
        when n.ViewCount > 5 then 'TB'
        when n.ViewCount > 10 then 'H'
        else 'T'  end as 'Text'
from news n

-- cach dung like trong sql
-- 1. % dai dien cho 0 hoac nhieu ki tu. Exp: 'a%'
-- 2. _ dai dien cho 1 ki tu don. Exp: 'a_'
-- 3. [ ] tim ki tu cu the trong khoang. Exp: 'a[bc]%' (bat dau tu ki tu 'a', ki tu sau co the la 'b' or 'c')
-- 4. [^ ] loai tru ki tu cu the. Exp: 'a[^b]%'

explain SELECT name 
FROM sqlite_master 
WHERE type = 'index';


------------
create view TestView as
select n.NewsId, n.ViewCount,
       case 
        when n.ViewCount > 5 then 'TB'
        when n.ViewCount > 10 then 'H'
        else 'T'  end as 'Text'
from news n

select * from TestView


-- delete from MstDistricts where districtcode = '90_LyNhan'







