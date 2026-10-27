# Lịch cá nhân

Khi API khởi động, migration `0069_PersonalCalendar.sql` tạo bảng sự kiện, danh mục quyền `calendar.use` và mục menu. Tài khoản database của API cần quyền thực thi migration. Admin có quyền theo cơ chế sẵn có; các vai trò khác cần được cấp **Sử dụng lịch cá nhân** trong trang quản trị và đăng nhập lại hoặc làm mới phiên để nhận quyền.

Frontend và API kiểm tra quyền `calendar.use`. API lấy mã chủ sở hữu từ phiên đăng nhập và giới hạn mọi truy vấn, sửa, xóa theo mã đó; không dùng mã chủ sở hữu từ client. Mỗi sự kiện có version để từ chối ghi đè hoặc xóa phiên bản đã cũ. Sau thông báo xung đột, đóng form, tải lại lịch và mở sự kiện để sửa lại.

Ngày kết thúc được tính bao gồm cả ngày đó. Ngày và giờ được lưu theo giá trị người dùng nhập, không chuyển múi giờ; hiện chưa có chức năng thay đổi múi giờ, lặp lại, nhắc nhở hoặc đồng bộ lịch bên ngoài. Khi tải lịch, API lấy các sự kiện giao với khoảng ngày đang hiển thị, kể cả sự kiện bắt đầu từ tháng trước. Nếu không tải hoặc lưu được, giao diện báo lỗi và giữ nội dung đang sửa.

Đây là tính năng riêng tư: không đăng sự kiện lên trang công khai. Người dùng nên triển khai API và migration trước frontend; sau đó đăng nhập và kiểm tra tạo, tải lại trang, sửa, xóa sự kiện bằng tài khoản có quyền.

Chuông thông báo có mục riêng cho các sự kiện giao với ngày hiện tại theo ngày trên thiết bị. Khi có sự kiện, chuông hiện chấm màu; số trên chuông vẫn chỉ tính thông báo tương tác chưa đọc. Danh sách lịch được làm mới khi mở chuông, quay lại tab, định kỳ khi trang đang hiển thị và sau khi tạo/sửa/xóa trong trang hiện tại. Đây là nhắc lịch trong website, không gửi push khi website đóng và không có trạng thái đã đọc riêng cho từng sự kiện.
