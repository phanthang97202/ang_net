# Phân quyền báo cáo ca trực và doanh thu

Triển khai Client và API cùng nhau. API kiểm tra quyền trên từng endpoint; guard và nút trên UI dùng cùng mã quyền. Admin tiếp tục được đi qua các kiểm tra quyền theo cơ chế hiện có.

| Mã quyền | API/thao tác |
| --- | --- |
| `shiftreport.view` | Danh sách, chi tiết, tồn kho nước, tổng hợp ca; vào `/tools/shift-report`, in và xuất Excel |
| `shiftreport.create` | `POST /api/ShiftReport/Create` |
| `shiftreport.update` | `PUT /api/ShiftReport/Update/{id}` |
| `shiftreport.delete` | `DELETE /api/ShiftReport/Delete/{id}` |
| `revenuereport.view` | `GET /api/RevenueReports`; vào `/tools/revenue-report`, lọc và in doanh thu |

Để thao tác qua màn quản lý ca, cấp `shiftreport.view` cùng các quyền tạo/sửa/xóa cần thiết. Quyền CRUD không tự cấp các quyền khác. API CRUD kiểm tra mã quyền riêng của thao tác đó. In/Excel dùng quyền xem vì dữ liệu đã được cung cấp cho người xem; không có endpoint xuất file riêng. Nút xuất Excel doanh thu hiện vẫn là TODO có sẵn, thay đổi này không triển khai chức năng xuất đó. Trợ lý AI giữ giới hạn Admin; các công cụ của nó gọi qua API báo cáo đã được bảo vệ.

Menu API, menu dự phòng ở navbar và link footer đều lọc theo quyền xem. Nhập trực tiếp URL vẫn qua guard; gọi API trực tiếp vẫn qua authorization. Chưa đăng nhập/token hết hạn nhận 401; đăng nhập nhưng thiếu quyền nhận 403. Kiểm tra tài khoản hoạt động ở global filter của API được giữ nguyên.

## Cấp quyền và chuyển phiên

1. API startup migrator chạy script `0038_SeedQuyenBaoCaoDoanhThu.sql`, bổ sung `revenuereport.view` vào danh mục. Bốn quyền `shiftreport.*` đã có từ script 0012.
2. Trong quản lý vai trò, chọn quyền tương ứng rồi gán vai trò cho tài khoản. Migration không tự cấp quyền hay thay đổi vai trò/tài khoản hiện có.
3. Đăng nhập lại hoặc lấy access token mới sau khi thay đổi quyền. Hệ thống gộp role claims vào JWT khi phát token; việc đổi vai trò/quyền không tự thay đổi claims trong token đang dùng. Khi cần áp dụng ngay, Admin dùng **Thu hồi mọi phiên** trong quản lý người dùng: access/refresh token cũ bị vô hiệu hóa và người dùng phải đăng nhập lại để nhận quyền mới. Không truy vấn DB danh sách quyền trên mỗi request; việc kiểm tra tài khoản và phiên dùng cơ chế trong `ACCOUNT_LOGIN.md`.

Tài khoản từng dùng báo cáo công khai giờ phải đăng nhập và được cấp quyền. Quyền xem doanh thu độc lập với quyền xem ca; người có quyền xem ca vẫn đọc được số liệu tiền trong chính báo cáo ca, như trước.

## Kiểm thử

`ReportPermissionTests` dùng server HTTP local, JWT ký bằng khóa test và business service mock, không đọc/ghi DB hoặc báo cáo thật. Kiểm tra đủ 8 endpoint với anonymous, token không quyền, các quyền khác, token hết hạn, đúng quyền và Admin; request bị từ chối không gọi service. Kiểm tra thêm không còn `AllowAnonymous` ở hai controller.

Frontend kiểm tra guard từ route thật, menu desktop/mobile từ API và fallback, link footer, quyền CRUD và kiểm tra lại khi lưu/xác nhận xóa. Cần smoke test trên môi trường triển khai sau migration với tài khoản đã gán vai trò thực tế; migration và cấp quyền DB không được thực hiện trong test mock.

Kết quả local ngày 08/10/2026: 9 test HTTP phân quyền backend và 53 test frontend qua; API build và Client production build thành công. Trình duyệt xác minh cả hai URL báo cáo chuyển sang đăng nhập với phiên anonymous và các link báo cáo bị ẩn. Không tạo/sửa/xóa báo cáo thật hoặc gán quyền cho tài khoản thật trong quá trình kiểm tra.
