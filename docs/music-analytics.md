# Thống kê âm nhạc

Sau khi triển khai API, `DatabaseMigrator` tự chạy `0068_MusicAnalytics.sql` một lần khi khởi động. Script tạo bảng `MusicAnalyticsEvent`, index theo thời gian và quyền `music.analytics.view`. Không cần tạo bảng thủ công nếu tài khoản database của API có quyền thực thi migration.

Trong trang quản trị, cấp quyền **Xem thống kê âm nhạc** cho vai trò cần sử dụng. Admin được phép theo cơ chế quyền hiện tại. Người dùng cần đăng nhập lại hoặc làm mới phiên để nhận quyền mới. Mở **Thống kê → Thống kê âm nhạc**.

Trang ghi nhận tìm kiếm, lỗi tìm kiếm, lựa chọn bài, phát thành công và lỗi phát từ YouTube, Audius và trình phát thư viện. Lượt phát chỉ ghi khi trình phát báo đang phát, không ghi lặp khi tạm dừng rồi tiếp tục cùng bài. Lựa chọn bài chỉ ghi khi người dùng nhấn vào dòng bài, không tính lần tự chuyển bài. Lỗi bị trình duyệt chặn tự phát không được coi là lỗi bài hát. Dữ liệu sự kiện bắt đầu từ khi triển khai, không có lịch sử trước đó.

Số tài khoản chỉ bao gồm tài khoản đăng nhập, không gồm khách. Thống kê dựa trên sự kiện được trình duyệt gửi và có thể thiếu nếu request thất bại, bị chặn hoặc bị giới hạn tần suất. Danh sách gần đây giới hạn 100 sự kiện; bộ lọc bộ sưu tập chỉ gồm các bộ công khai đã có hoạt động trong khoảng chọn. Sự kiện từ bộ riêng tư và không công khai không lưu mã bộ. Truy vấn chọn tối đa 93 ngày theo giờ Việt Nam.

Bảng lưu từ khóa tìm kiếm, tên bài, mã tài khoản (nếu đăng nhập), nguồn và thời gian; cần xem xét chính sách bảo mật và thời gian lưu phù hợp với website. Hiện không tự xóa dữ liệu. Chức năng chưa đọc hoặc hiển thị quota Google Cloud.
