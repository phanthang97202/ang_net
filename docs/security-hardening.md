# Vá bảo mật tài khoản và nội dung

- `DELETE /api/Account/deleteuser` chỉ dành cho Admin.
- Khôi phục mật khẩu giới hạn theo IP và theo email; phản hồi yêu cầu mã không tiết lộ tài khoản có tồn tại. Mỗi mã có tối đa 5 lượt thử được cập nhật nguyên tử trong database. Giới hạn theo IP và email hiện nằm trong bộ nhớ từng tiến trình: nếu chạy nhiều instance cần bộ đếm chia sẻ và cấu hình proxy tin cậy để IP không bị giả mạo.
- Bài viết được lọc HTML khi hiển thị, kể cả dữ liệu cũ. Iframe chỉ được phép từ các nhà cung cấp khai báo trong `NewsContentComponent`; nếu cần nguồn nhúng khác, phải kiểm tra và bổ sung hostname. Triển khai cùng gói DOMPurify trong lockfile.
- Liên kết ghi chú mới dùng URL fragment, không gửi token trong đường dẫn HTTP. API mới nhận `X-Note-Token`, và không ghi log request cho các endpoint chia sẻ. Các endpoint/URL cũ vẫn hoạt động để tương thích, nhưng đường dẫn cũ có thể đã xuất hiện trong log reverse proxy hoặc hosting. Thu hồi link chỉnh sửa cũ và chia sẻ lại bằng link mới nếu có nguy cơ lộ; áp dụng chính sách giữ log phù hợp tại các dịch vụ hosting.

Triển khai API trước frontend để frontend có thể gọi các endpoint nhận header. Không xóa log hoặc tự thu hồi liên kết trong quá trình cập nhật; thực hiện theo quy trình quản trị khi đã xác định phạm vi ảnh hưởng. Các khóa hoặc token đã bị lộ cần được xoay vòng/thu hồi riêng; cập nhật mã không làm chúng mất hiệu lực.
