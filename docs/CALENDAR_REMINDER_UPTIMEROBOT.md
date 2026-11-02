# Email nhắc lịch cá nhân bằng UptimeRobot

Luồng chạy:

1. UptimeRobot gọi endpoint mỗi 5 phút để đánh thức Render Free.
2. API đổi thời gian hiện tại sang múi giờ `Asia/Ho_Chi_Minh`.
3. API đọc `PERSONAL_CALENDAR_REMINDER_ENABLED` và
   `PERSONAL_CALENDAR_REMINDER_TIME` trong **Tham số hệ thống**.
4. Khi đã đến giờ, API tổng hợp các lịch cần làm trong ngày và gửi qua Resend.
5. Bảng `PersonalCalendarReminderDelivery` bảo đảm mỗi tài khoản chỉ nhận một
   email mỗi ngày. Bản ghi lỗi được thử lại ở lần gọi sau.

## 1. Cấu hình Resend và Render

Thêm các biến sau vào **Render > Web Service > Environment**:

| Key | Giá trị |
| --- | --- |
| `Resend__ApiKey` | API key của Resend |
| `Resend__FromEmail` | Ví dụ: `Phan Thang Blog <onboarding@resend.dev>` |
| `CalendarReminder__TriggerSecret` | Chuỗi bí mật ngẫu nhiên, URL-safe và dài tối thiểu 32 ký tự |
| `CalendarReminder__CalendarUrl` | `https://thangphan.vercel.app/calendar` (không bắt buộc) |

Sau khi thêm biến, chọn **Save and deploy**.

## 2. Cấu hình UptimeRobot Free

Gói Free không hỗ trợ custom method, request body và custom header. Tạo một
**HTTP(s) Monitor** dùng request `HEAD` mặc định:

| Trường | Giá trị |
| --- | --- |
| Friendly name | `Phan Thang - Calendar reminder` |
| URL | `https://ang-net.onrender.com/api/internal/calendar-reminders/ping?token=<SECRET>` |
| Monitoring interval | `5 minutes` |
| HTTP method | `HEAD` (mặc định) |

Thay `<SECRET>` bằng đúng giá trị của `CalendarReminder__TriggerSecret`. Nếu
secret có ký tự đặc biệt thì phải URL-encode; nên dùng chuỗi chỉ gồm chữ, số,
gạch ngang và gạch dưới để cấu hình đơn giản hơn.

Endpoint chấp nhận cả `HEAD` và `GET`, vì UptimeRobot có thể thử lại bằng `GET`
khi request `HEAD` thất bại. API trả:

- `200`: chưa đến giờ, chức năng đang tắt, không có lịch hoặc đã xử lý thành công;
- `401`: token sai;
- `503`: thiếu hoặc sai cấu hình;
- `502`: có ít nhất một email gửi thất bại.

Token trong query string có thể xuất hiện trong lịch sử UptimeRobot và access
log của hạ tầng. Không chia sẻ URL monitor; nếu URL bị lộ, hãy thay
`CalendarReminder__TriggerSecret` trên Render và cập nhật URL monitor.

## 3. Endpoint dành cho gói trả phí hoặc dịch vụ cron khác

Endpoint bảo mật bằng header vẫn được giữ nguyên:

```http
POST /api/internal/calendar-reminders/run
X-Calendar-Cron-Secret: <SECRET>
Content-Type: application/json

{}
```

Ưu tiên endpoint này khi dịch vụ gọi hỗ trợ custom header, vì secret không nằm
trong URL.

## 4. Thay đổi giờ gửi

Vào **Dashboard > Tham số hệ thống**:

- `PERSONAL_CALENDAR_REMINDER_ENABLED`: `true` hoặc `false`.
- `PERSONAL_CALENDAR_REMINDER_TIME`: giờ Việt Nam theo định dạng `HH:mm`, ví dụ
  `08:00`.

Vì UptimeRobot Free gọi theo chu kỳ 5 phút, email có thể trễ khoảng 5 phút. Nếu
Render đang ngủ, lần gọi đầu tiên còn phải chờ dịch vụ khởi động; lần gọi sau sẽ
tiếp tục xử lý.

## 5. Điều kiện nhận email

Email chỉ được gửi khi:

- tài khoản đang hoạt động và có địa chỉ email hợp lệ;
- có ít nhất một lịch đang diễn ra trong ngày;
- trạng thái của lịch hoặc lần lặp không phải `done` hay `cancelled`;
- tài khoản chưa nhận bản tổng hợp của ngày hiện tại.

Lịch nhiều ngày và lịch lặp đều sử dụng cùng dữ liệu của module Lịch cá nhân.
Nội dung do người dùng nhập được HTML-encode trước khi đưa vào email.
