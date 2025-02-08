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

select * from NewsCategory
select * from News order by CreatedDTime desc
select * from HashTagNews
select * from RefFileNews
select * from PointNews

delete from News where NewsId  like '0%'
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
select distinct(n.ViewCount)
from News n
order by n.ViewCount asc





