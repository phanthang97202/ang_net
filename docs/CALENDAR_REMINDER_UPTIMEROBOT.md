# Email nhắc lịch cá nhân bằng UptimeRobot

Luồng chạy:

1. UptimeRobot gửi `POST` mỗi 5 phút để đánh thức Render Free.
2. API đổi thời gian hiện tại sang múi giờ `Asia/Ho_Chi_Minh`.
3. API đọc `PERSONAL_CALENDAR_REMINDER_ENABLED` và
   `PERSONAL_CALENDAR_REMINDER_TIME` trong **Tham số hệ thống**.
4. Khi đã đến giờ, API tổng hợp các lịch đang cần làm trong ngày và gửi qua
   Resend HTTPS API.
5. Bảng `PersonalCalendarReminderDelivery` bảo đảm mỗi tài khoản chỉ nhận một
   email mỗi ngày. Bản ghi lỗi được retry ở lần gọi sau.

## 1. Cấu hình Resend

Xác minh domain gửi trong Resend, tạo API key có quyền gửi email, sau đó thêm
các biến sau vào **Render > Web Service > Environment**:

| Key | Giá trị |
| --- | --- |
| `Resend__ApiKey` | API key của Resend |
| `Resend__FromEmail` | Ví dụ: `Phan Thang Blog <reminder@phanthang.site>` |
| `CalendarReminder__TriggerSecret` | Chuỗi bí mật ngẫu nhiên dài ít nhất 32 byte |
| `CalendarReminder__CalendarUrl` | `https://phanthang.site/calendar` (không bắt buộc) |

Không ghi các giá trị bí mật vào source, `appsettings*.json`, log hoặc URL.
Sau khi thêm biến, chọn **Save and deploy**.

## 2. Cấu hình UptimeRobot

Tạo **API Monitor** với cấu hình:

| Trường | Giá trị |
| --- | --- |
| Friendly name | `Phan Thang - Calendar reminder` |
| URL | `https://ang-net.onrender.com/api/internal/calendar-reminders/run` |
| Method | `POST` |
| Monitoring interval | `5 minutes` |
| Request body | `{}` |
| Content-Type | `application/json` |

Thêm custom header:

```text
X-Calendar-Cron-Secret: <cùng giá trị với CalendarReminder__TriggerSecret>
```

API trả `200` khi chưa đến giờ, đã tắt chức năng, không có lịch, hoặc xử lý
thành công. API trả `401` nếu secret sai, `503` nếu thiếu cấu hình, và `502`
khi ít nhất một email gửi thất bại. Nhờ vậy UptimeRobot có thể cảnh báo và tự
gọi lại mà không gửi trùng các email đã thành công.

## 3. Thay đổi giờ gửi

Vào **Dashboard > Tham số hệ thống**:

- `PERSONAL_CALENDAR_REMINDER_ENABLED`: `true` hoặc `false`.
- `PERSONAL_CALENDAR_REMINDER_TIME`: giờ Việt Nam theo định dạng `HH:mm`, ví dụ
  `08:00`.

Vì UptimeRobot Free gọi theo chu kỳ 5 phút, thời điểm nhận email có thể trễ tối
đa khoảng 5 phút. Nếu Render đang ngủ, lần gọi đầu còn phải chờ dịch vụ khởi
động; lần gọi sau sẽ tiếp tục xử lý.

## 4. Điều kiện nhận email

Email chỉ được gửi khi:

- tài khoản đang hoạt động và có địa chỉ email hợp lệ;
- có ít nhất một lịch đang diễn ra trong ngày;
- trạng thái của lịch hoặc lần lặp không phải `done` hay `cancelled`;
- tài khoản chưa nhận bản tổng hợp của ngày hiện tại.

Lịch nhiều ngày và lịch lặp đều được tính theo cùng dữ liệu của module Lịch cá
nhân. Nội dung do người dùng nhập được HTML-encode trước khi đưa vào email.
