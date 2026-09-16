-- Danh dau bai viet da gui mail bao cho nguoi dang ky hay chua.
--
-- Vi sao can cot rieng thay vi dua vao FlagActive: Update cho phep sua bai nhieu
-- lan sau khi da dang, nen neu gan viec gui mail vao su kien "bai duoc xuat ban"
-- thi moi lan sua loi chinh ta roi luu lai la nguoi doc nhan them mot mail nua.
--
-- NULL = chua gui. Da co gia tri = da gui, khong gui lai nua.
ALTER TABLE "News" ADD COLUMN "NotifiedAt" timestamp with time zone NULL;
