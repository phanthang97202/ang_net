insert into MstProvinces values 
('90HANAM2', 'Hà Nam', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

select count(*) from MstProvinces

delete from MstProvinces where ProvinceCode  = 'HANOI'  or  ProvinceCode = 'DANANG'

select * from AspNetUsers where UserId = "9d430ca5-5214-4be5-b68f-ff1214c189ca"
select * from AspNetUserRoles
select * from AspNetRoles
select * from chat
delete from Chat where MessageId = '2a157142-7a67-41c3-a337-5db73909c92f'  UserId  = 'anhduong@gmail.com' or UserId = 'phanthang@gmail.com'
update  chat set Message = 'https://i.pinimg.com/736x/f1/58/14/f15814f88258c133540f9e914499364d.jpg'  where MessageId = 'test11'
insert into chat values 
('test11', '2024-10-01 23:30:52.0811634', '2024-10-10 23:30:52.0811634', 'admin@gmail.com', 'jpg')

insert into NewsCategory values 
('anime', '', 'Anime', 1, 1, '2024-10-10 23:30:52.0811634', '2024-10-10 23:30:52.0811634')

insert into News values 
('toga', '9d430ca5-5214-4be5-b68f-ff1214c189ca', 'anime', 'toga', '', '', '', '<p>Thang</p>', '2024-10-10 23:30:52.0811634', '2024-10-10 23:30:52.0811634', 1, 0, 0, 0, 0, '', '')

update News  
set ContentBody = '"<h3><strong style=\"background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);\">Quirk và kh? n?ng ??c bi?t c?a Toga Himiko</strong></h3><ul><li><strong style=\"background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);\">Quirk: Transform:</strong><span style=\"background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);\"> Kh? n?ng bi?n ??i ngo?i hình và máu thành c?a ng??i khác b?ng cách u?ng máu c?a h?.</span></li><li><strong style=\"background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);\">?u ?i?m:</strong><span style=\"background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);\"> Linh ho?t trong chi?n ??u, kh? n?ng ng?y trang hoàn h?o, có th? s? d?ng s?c m?nh c?a nh?ng ng??i mà cô ?ã bi?n ??i.</span></li><li><strong style=\"background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);\">H?n ch?:</strong><span style=\"background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);\"> C?n ph?i u?ng máu th??ng xuyên ?? duy trì bi?n ??i, có th? b? m?t ki?m soát khi u?ng quá nhi?u máu.</span></li></ul><p></p><p></p><p>Tác gi?: PHan Thang</p>"' 
where NewsId = 'toga'

select * from News
select * from HashTagNews
select * from RefFileNews
select * from PointNews

delete from News
delete from HashTagNews

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














