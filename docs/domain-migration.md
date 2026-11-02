# Domain production

Địa chỉ công khai hiện tại: `https://thangphan.vercel.app`.

- Client: `middleware.js` quyết định canonical, Open Graph, JSON-LD, sitemap và RSS; `src/index.html` và `src/robots.txt` có giá trị dự phòng. Khi đổi domain, cập nhật cả ba rồi deploy lại frontend.
- API: email mặc định trỏ về domain trên. Có thể đặt `Blog__BaseUrl` trên Render thành HTTPS origin, không có đường dẫn; sau khi thay đổi cần deploy/restart API.
- MCP: nếu Render đã đặt `Mcp__BlogUrl`, cập nhật biến đó; biến môi trường ghi đè giá trị mặc định trong code.
- Bình luận: thêm hostname mới vào widget Cloudflare Turnstile và cập nhật `Turnstile__AllowedHostnames` trên Render. Xem `turnstile-comments.md`.
- Sau khi triển khai, kiểm tra HTML trang chủ và bài viết, `/robots.txt`, `/sitemap.xml`, `/rss.xml` và gửi sitemap vào Google Search Console. Nếu còn kiểm soát domain cũ, cấu hình chuyển hướng 301 từng đường dẫn tương ứng; nếu không thì không thể thiết lập redirect ở domain cũ.
