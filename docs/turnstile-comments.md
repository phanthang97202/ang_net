# Turnstile cho bình luận bài viết

Luồng: widget Angular lấy token với action `news_comment` → POST
`/api/NewsComment/Comment` kèm `TurnstileToken` → API gọi Cloudflare Siteverify →
kiểm tra success, action và hostname trước khi lưu. Áp dụng cả bình luận gốc và trả lời.
Không cần migration database hay cài thêm package.

## Cấu hình production

1. Cloudflare → Turnstile → chọn widget → Settings. Đổi Secret key đã xuất hiện
   trong ảnh bằng **Rotate Secret Key**. Dùng cặp Site key/Secret key thuộc cùng widget.
2. Chọn chế độ **Managed**. Trong Hostnames, thêm domain frontend thực tế, ví dụ
   `phanthang.site`, và `www.phanthang.site` nếu website phục vụ cả địa chỉ đó.
   Nhập hostname, không nhập `https://`, port hay đường dẫn. Pre-clearance không cần
   bật cho luồng xác minh từng bình luận này.
3. Trên **Vercel → project ang-net → Settings → Environment Variables**, thêm
   `TURNSTILE_SITE_KEY` với giá trị **Site key** của widget, chọn **Production**.
   Tên `turnstileSiteKey` cũng được hỗ trợ để tương thích cấu hình đã tạo.
   Nếu có cả hai, `TURNSTILE_SITE_KEY` được ưu tiên. Đây là public config;
   tuyệt đối không đưa Secret key lên frontend.

   `Client/vercel.json` dùng Build Command `npm run build`. Sau Angular build,
   script `postbuild` chèn riêng Site key vào meta `turnstile-site-key` trong
   `dist/client/browser/index.html`; widget đọc meta này khi chạy trên browser.
   Không đưa biến môi trường khác vào HTML và không sửa file source lúc build.
   Nếu project đặt Root Directory là `Client`, cấu hình này tự được áp dụng.

   Khi build ở môi trường khác, truyền `TURNSTILE_SITE_KEY` vào `npm run build`.
   Nếu không có biến build, có thể cấu hình trực tiếp trong
   `Client/src/environments/environment.prod.ts` làm giá trị dự phòng:

   ```ts
   turnstileSiteKey: 'SITE_KEY_CUA_WIDGET',
   ```

   Nếu chạy `npm start` để gọi API production, đặt Site key tương ứng trong
   `environment.ts` và cho phép hostname phát triển bằng một widget riêng khi cần.
4. Render Dashboard → chọn dịch vụ API `ang-net` → **Environment** → thêm:

   | Key | Value |
   | --- | --- |
   | `Turnstile__SecretKey` | Secret key mới, chỉ nhập trực tiếp trên Render |
   | `Turnstile__AllowedHostnames` | `phanthang.site,www.phanthang.site` (đổi theo domain đang dùng) |

   API so khớp hostname chính xác; mỗi frontend preview domain phải được thêm cả
   trong Cloudflare lẫn biến trên nếu muốn dùng để thử. Đây là hostname frontend,
   không phải `ang-net.onrender.com`. Dấu `__` là hai dấu gạch dưới.
5. Chọn **Save only** nếu chưa triển khai code mới, rồi deploy API có thay đổi này
   để code và biến môi trường có hiệu lực cùng nhau. Nếu code đã deploy, dùng
   **Save and deploy**. Build và deploy lại frontend sau khi đặt Site key.
   Trên Vercel, tạo deployment mới từ commit có hỗ trợ `postbuild` này. Thay đổi
   biến môi trường không cập nhật các deployment cũ. Không chỉ chạy `npx ng build`
   vì lệnh đó bỏ qua bước `postbuild` của npm.

Các giá trị dự phòng trong source để trống. Khi chưa cấu hình, phần bình luận sẽ chặn gửi.
API không có chế độ bỏ qua CAPTCHA. Nên triển khai frontend và backend gần nhau
để client cũ không tiếp tục gửi request thiếu token.

## Thử local bằng public test keys

Chỉ dùng với API local chạy `Development`, không trỏ frontend test vào API production.

1. Trong `Client/src/environments/environment.ts`:

   ```ts
   turnstileSiteKey: '1x00000000000000000000AA',
   apiUrl: 'http://localhost:5000/api/',
   wsUrl: 'http://localhost:5000/',
   ```

2. Mở PowerShell từ thư mục gốc repo, dùng public testing secret của Cloudflare:

   ```powershell
   $env:ASPNETCORE_ENVIRONMENT = 'Development'
   $env:Turnstile__SecretKey = '1x0000000000000000000000000000000AA'
   $env:Turnstile__AllowedHostnames = 'localhost,127.0.0.1'
   dotnet run --project API/src/angnet.WebApi --launch-profile http
   ```

   Giữ cấu hình database/Redis local hiện có của dự án. Các giá trị trên là test
   keys công khai, không phải Secret key của widget production. API từ chối test
   secrets ngoài môi trường `Development`.
3. Mở terminal khác trong `Client`, chạy `npm start`, truy cập `http://localhost:4200`.
4. Đăng nhập, mở bài viết và gửi thử bình luận gốc, trả lời, rồi gửi tiếp lần hai.
   Nút gửi chỉ bật khi có nội dung và token. Token dùng một lần, hết hạn sau 5 phút;
   widget tự làm mới khi hết hạn và được reset sau mỗi request gửi bình luận.
5. Thử ngắt mạng hoặc dùng cặp test keys luôn thất bại trong tài liệu Cloudflare:
   bình luận không được lưu và bản nháp phải còn nguyên. Không dùng public test
   keys trên website thật.

## Kiểm tra sau triển khai

- Đăng nhập → mở bài viết → widget xác minh → gửi bình luận → bình luận xuất hiện.
- Trả lời một bình luận và gửi bình luận thứ hai để kiểm tra token mới.
- Trong DevTools → Network, request Comment có `TurnstileToken`; Secret key không
  xuất hiện trong browser. Xóa token hoặc thay token bằng chuỗi bất kỳ rồi gửi lại:
  API trả `Success: false`, không lưu bình luận.
- Nếu gửi lỗi, nội dung nhập vẫn còn; chờ xác minh mới rồi thử lại.
- Nếu widget không tải: kiểm tra ad blocker, mạng và CSP của hosting frontend.
  Nếu có CSP, cho phép `https://challenges.cloudflare.com` trong `script-src` và
  `frame-src`; không tự host hoặc proxy file `api.js`.
- Nếu thấy "Tạm thời chưa thể xác minh" ngay khi mở ô bình luận, không có widget:
  kiểm tra HTML trang có `<meta name="turnstile-site-key" content="...">` chưa.
  Nếu chưa có, xác nhận đúng tên biến, scope Production, Build Command
  `npm run build` và deployment đã dùng commit mới. Build logs phải có dòng
  `Turnstile: public Site key added to built index.html.`
- Nếu API báo tạm thời không xác minh được: kiểm tra hai biến Render, deployment
  đã nhận biến mới chưa và kết nối ra Cloudflare. Nếu báo xác minh không hợp lệ:
  kiểm tra cặp keys, frontend hostname và token đã dùng/hết hạn.

## Kiểm thử tự động

```powershell
dotnet test API/test/angnet.McpTests/angnet.McpTests.csproj --filter FullyQualifiedName~TurnstileTests
cd Client
node --test scripts/configure-turnstile.test.mjs
npx ng test --watch=false --browsers=ChromeHeadless --include='src/app/pages/home/detail-news/news-comments/*spec.ts' --include='src/app/components/turnstile/*spec.ts'
npm run build
```

## Tài liệu

- [Cloudflare: server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Cloudflare: public testing keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)
- [Cloudflare: rotate secret key](https://developers.cloudflare.com/turnstile/troubleshooting/rotate-secret-key/)
- [Cloudflare: CSP](https://developers.cloudflare.com/turnstile/reference/content-security-policy/)
- [Render: environment variables](https://render.com/docs/configure-environment-variables)
- [Vercel: environment variables](https://vercel.com/docs/environment-variables)
