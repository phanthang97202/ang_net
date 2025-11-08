## Refactoring code to DDD 
    Not Done
        But must to detach into ClassLibary project instead put into same Folder 

## Multi-tenancy
    Pending
        Update database structure for multi tenant (User, Province, News, Stadium)

## Update: active/inactive user => allow/ban permission to access api
    InProcess => Completed
        https://stackoverflow.com/questions/52087381/custom-authorization-filter-vs-policy-in-asp-net-core-2-1
        https://learn.microsoft.com/en-us/aspnet/core/mvc/controllers/filters?view=aspnetcore-9.0
        Ex: 
            https://viblo.asia/p/policy-based-authorization-trong-asp-net-core-1VgZvQq1KAw

## Forgot password
    Continue complete forgot password for client page (angular)

## Comment on news blog
    Continue developing feature comment on blog

## Initialize e-com web using Nextjs 15

## 2025-11-05:
    Đã thêm 1 cột IsUseForRevenueReport bằng cách thủ công không dùng Migration, cần phải xem lại cái này để đảm bảo các DB khác được đồng bộ trong quá trình Test và Prod

## 2025-11-06:
    Đã sửa lại và chuẩn hóa lại thông báo lỗi của hệ thống (Chống tình trạng bắn nhiều thông báo khi có nhiều lỗi đồng thời). Bây giờ đã được gom chung vào 1 thông báo
    Đã chuẩn hóa lại code và các bug liên quan đến Chat box: Scroll to top to fetch old message, style UI, ....

## 2025-11-08:
    Hiện tại đang bị lệch mốc thời gian báo cáo giữa EzCloud và Angnet. 
    Lệch ở đoạn mốc thời gian Checkin Checkout
    Checkin thuộc tháng 10, Checkout thuộc tháng 11 thì
        bên Angnet đang lấy mốc Checkin để thống kê doanh thu, còn bên EzCloud thì đang lấy mốc Checkout để thống kê doanh thu
    VD: MHĐ: 7008: Checkin 2025-10-31 22:10 : Chưa thanh toán
                Checkout 2025-11-01 12:00: Thanh toán 550k
            => Sẽ có sự chênh lệch số liệu giữa tháng 10 và 11 của 2 hệ thống Angnet và EzCloud