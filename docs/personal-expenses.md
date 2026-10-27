# Thu chi cá nhân

Migration `0071_PersonalExpenses.sql` tự chạy khi API khởi động và tạo hai bảng giao dịch, danh mục riêng, cùng quyền `expenses.use` và mục menu. Tài khoản database của API cần quyền chạy migration. Admin dùng cơ chế quyền hiện có; vai trò khác cần được cấp **Sử dụng thu chi cá nhân** và đăng nhập lại hoặc làm mới phiên.

Mỗi giao dịch thuộc tài khoản đăng nhập; API kiểm tra quyền và chủ sở hữu trên mọi thao tác. Giao dịch dùng version để phát hiện sửa/xóa đồng thời. Số tiền là số nguyên VND từ 1 đến 1.000.000.000.000 đồng; chênh lệch là tổng thu trừ tổng chi trong tháng, không phải số dư tài khoản ngân hàng.

Danh mục mặc định dùng chung; danh mục tự tạo được lưu riêng cho từng tài khoản. Lọc danh mục chỉ thay đổi danh sách giao dịch, không thay đổi tổng thu, tổng chi hoặc biểu đồ của cả tháng. Triển khai API và migration trước frontend. Ngân sách và giao dịch định kỳ chưa thuộc phiên bản đầu.
