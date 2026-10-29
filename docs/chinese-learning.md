# Học tiếng Trung

Module `/chinese` cần quyền `chinese.use`. Migration `0076_ChineseLearning.sql` được API tự chạy khi khởi động và tạo bảng bài luyện, từ vựng, quyền và menu. Tài khoản database phải có quyền chạy migration. Admin có quyền qua cơ chế hiện có; vai trò khác cần được cấp quyền và đăng nhập lại hoặc làm mới phiên.

Để sinh bài, cấu hình biến bí mật `Groq__ApiKey` trên môi trường của API (Render), không đưa khóa vào frontend hoặc Git. Khóa từng cấu hình riêng trên Vercel không tự chuyển sang Render. Có thể đặt `Groq__ChineseModel`; mặc định là `qwen/qwen3.8-27b`. Xác nhận model khả dụng và hạn mức trên tài khoản Groq. Triển khai API và migration trước frontend.

Mỗi lần tạo yêu cầu tối đa 4 bài; API giới hạn 2 lần/phút/tài khoản trong mỗi tiến trình. Bài và từ đã lưu chỉ thuộc tài khoản tạo; mỗi lần tải tối đa 100 bài gần nhất theo loại/chủ đề và 1000 từ. Bài đã lưu có thể dùng khi Groq không khả dụng. Giới hạn tạo trong bộ nhớ không đồng bộ giữa nhiều instance; nếu mở rộng triển khai cần bộ giới hạn dùng chung.

Người học có thể tự tạo bài theo loại và chủ đề đang chọn bằng cách nhập chữ Trung, pinyin và bản dịch. Bài thủ công được lưu riêng cho tài khoản, không gọi Groq; khi xem đáp án, trình duyệt gợi ý tách từ và pinyin từ từ điển, người học tự nhập nghĩa và kiểm tra trước khi lưu. Có thể chọn chữ trong bài để lưu cụm từ khác. Bài nghe dùng giọng đọc của thiết bị, chưa hỗ trợ tải lên tệp âm thanh.

Trong biểu mẫu tạo bài, nút “Gõ bằng pinyin” mở bộ chọn chữ: nhập pinyin rồi chọn gợi ý để chèn vào vị trí con trỏ. Từ điển được tải từ website và tra cứu ngay trên trình duyệt, không gửi nội dung tới dịch vụ bên ngoài. Từ điển và thư viện [pinyinjs](https://github.com/KensioSoftware/pinyinjs) dùng giấy phép Apache-2.0 và CC BY-SA 4.0, có thành phần dữ liệu CC-CEDICT; xem LICENSE và NOTICE trong gói npm.

Chủ đề là danh mục riêng của từng người, quản lý tại Hồ sơ → Danh mục → Chủ đề tiếng Trung. Danh mục mặc định được tạo khi người dùng truy cập lần đầu; mã bốn chủ đề cũ được giữ nguyên nên các bài đã tạo vẫn nằm đúng chủ đề. Đổi tên không đổi mã. Chủ đề có bài đã lưu khi xóa sẽ được ẩn, có thể bật lại; người khác không thể dùng chủ đề riêng này. Tên chủ đề được gửi tới Groq để sinh nội dung phù hợp.

Chế độ nghe dùng Web Speech API với giọng Trung trên thiết bị. Thiết bị không có giọng phù hợp sẽ báo lỗi; chất lượng thay đổi theo thiết bị và không phải bản ghi được thẩm định. AI có thể sai chữ, pinyin hoặc bản dịch: bước kiểm tra chỉ kiểm tra định dạng và từ nằm trong câu, không chứng minh tính chính xác ngôn ngữ. Người dùng cần kiểm tra và chỉnh trước khi lưu từ. Bài dịch được tự đối chiếu với đáp án mẫu, chưa có chấm AI hay từ điển xác thực.
