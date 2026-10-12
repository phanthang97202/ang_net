# Kết nối ChatGPT với Phan Thang Blog qua MCP

API có MCP Streamable HTTP tại `/mcp`, OAuth authorization code + PKCE S256
qua OpenIddict. Không gửi mật khẩu quản trị trong prompt hay lưu mật khẩu vào skill.
Mặc định MCP **tắt**; deploy code không tự bật kết nối.

## 1. Cấu hình API trên Render

Thêm các environment variables vào **API**, không phải Angular Client:

| Biến | Giá trị |
| --- | --- |
| `Mcp__Enabled` | `true` |
| `Mcp__Issuer` | `https://ang-net.onrender.com/` |
| `Mcp__BlogUrl` | `https://phanthang.site` |
| `Mcp__SigningKey` | RSA private key PKCS#1 DER, base64; tối thiểu 2048 bit |
| `Mcp__EncryptionKey` | 32 byte ngẫu nhiên, base64 |
| `Mcp__RedirectUris__0` | `https://chatgpt.com/connector_platform_oauth_redirect` |

Hai khóa phải được tạo ngẫu nhiên **một lần** và lưu trong secret của Render.
Không đưa vào Git, frontend hoặc chat. Không tạo lại khóa mỗi lần deploy:
đổi khóa sẽ làm các grant đang lưu không dùng được và phải kết nối lại.
Issuer phải đúng origin HTTPS của API, có `/` ở cuối, không thêm `/api/`.

Ví dụ tạo khóa trên máy của bạn bằng OpenSSL:

```sh
openssl genrsa -traditional -out mcp-signing-private.pem 3072
openssl rsa -in mcp-signing-private.pem -traditional -outform DER -out mcp-signing-private.der
openssl base64 -A -in mcp-signing-private.der
openssl rand -base64 32
```

Chạy ngoài repo, không trong terminal được ghi log/chia sẻ. Dòng thứ ba là
`Mcp__SigningKey`; dòng cuối là `Mcp__EncryptionKey`. Cất khóa vào nơi lưu
secrets an toàn, sau đó xử lý các file riêng tư theo chính sách của bạn.

Sau deploy, migration `0050_TaoBangBlogMcpOAuth.sql` tự tạo bốn bảng OAuth và
hai quyền mới. Tài khoản Admin được phép theo cơ chế hiện tại; tài khoản khác
cần `mcp.connect`, `blog.create` để tạo bài; `mcp.publish` và `blog.update`
để xuất bản bản nháp. Quyền được kiểm tra lại từ DB khi gọi công cụ.

## 2. Thêm custom MCP server trong ChatGPT web

- Name: **Phan Thang Blog**.
- Description: đọc danh mục, tìm bài, tạo bản nháp và xuất bản bài viết của tài khoản đã liên kết.
- Server URL: **`https://ang-net.onrender.com/mcp`**.
- Authentication: **OAuth**.
- Advanced OAuth: dùng client đăng ký sẵn, Client ID **`phanthang-chatgpt`**;
  public client, không có Client Secret (`token_endpoint_auth_method=none`).
- Scopes: `blog.read blog.write blog.publish offline_access`.

Metadata tự công bố ở `/.well-known/oauth-authorization-server` và
`/.well-known/oauth-protected-resource`. Nếu giao diện yêu cầu nhập thủ công:

- Authorization URL: `https://ang-net.onrender.com/oauth/authorize`.
- Token URL: `https://ang-net.onrender.com/oauth/token`.
- Resource: `https://ang-net.onrender.com/mcp`.

Không bật dynamic client registration: API chỉ chấp nhận client đăng ký sẵn.
Nếu ChatGPT hiển thị callback riêng dạng `https://chatgpt.com/connector/oauth/...`,
thay `Mcp__RedirectUris__0` bằng **đúng URL đầy đủ** đó và redeploy. Không dùng wildcard.
API hỗ trợ `iss` trong authorization response (RFC 9207) cho callback chung.

Bạn đăng nhập trực tiếp tại form OAuth của API bằng tài khoản blog có mật khẩu
và xác nhận các quyền. Tài khoản chỉ Google mà chưa có mật khẩu không đăng nhập
được ở form này; dùng tài khoản local được quản trị viên tạo. Việc này không thay
đổi luồng Google login của website.

## 3. Công cụ và cách dùng

| Công cụ | Hành vi |
| --- | --- |
| `get_categories` | Lấy danh mục đang hoạt động |
| `search_posts` | Tìm bài công khai, tùy chọn thêm bản nháp của chính tài khoản |
| `get_post` | Đọc bài công khai hoặc bài của chính tài khoản, không tăng lượt xem |
| `create_post` | Tạo bài song ngữ HTML; mặc định bản nháp riêng tư; `publish=true` cần quyền xuất bản |
| `publish_post` | Xuất bản bài của chính tài khoản; không sửa nội dung hay đăng bài của người khác |

`create_post.post` theo DTO blog: `CategoryNewsId`, `ShortTitle`,
`ShortDescription`, `ContentBody`, các trường tương ứng thêm `En`, `Thumbnail`,
`LstHashTagNews`, `LstHashTagNewsEn`. Mỗi keyword có `HashTagNewsName`.
Nếu có bản tiếng Anh, điền đủ title, description, body và keyword tiếng Anh
khi bản Việt có keyword. HTML được lọc script, event handler, style; không
chèn H1 vì trang chi tiết đã có H1. Thumbnail dùng URL HTTPS. Không tải file
từ URL, không upload Cloudinary và không hỗ trợ file đính kèm qua MCP.

Luôn tìm trùng trước khi tạo. Nếu timeout, tìm lại theo tiêu đề; không tạo lại
mù quáng. Khi tiêu đề đã tồn tại, công cụ không ghi đè hoặc tạo bản trùng.
Đối với bài mới, lấy `NewsId` trả về để đọc kiểm tra bản nháp rồi xuất bản.

Ví dụ chỉ dẫn:

> Lấy danh mục và tìm bài liên quan trước. Soạn bài Việt-Anh theo checklist UX/SEO
> đã cung cấp, không bịa trải nghiệm hoặc nguồn. Dùng create_post để lưu bản nháp,
> get_post kiểm tra, chỉ dùng publish_post khi tôi yêu cầu xuất bản.

ChatGPT web không đọc được skill `create-news` từ ổ C:/F: trên máy này.
Đưa hướng dẫn viết bài vào instruction của cuộc chat/automation. MCP cung cấp
các thao tác trên blog, không tự tạo nội dung theo lịch và không tự gọi OpenAI API.

## 4. Lịch tự động và bảo mật

Kết nối OAuth giúp ChatGPT làm mới token mà không cần gửi mật khẩu mỗi lần:
access token 15 phút, refresh token 30 ngày và được xoay vòng. Nếu refresh
token hết hạn hoặc quyền thay đổi, bạn cần kết nối lại. Đây không phải cam kết
phiên sẽ tồn tại vĩnh viễn.

**MCP không bỏ qua cơ chế phê duyệt thao tác ghi của ChatGPT.** Xác minh bằng
một bài thử và một lần chạy lịch trước: một automation có thể dùng chat mới
và vẫn yêu cầu phê duyệt lại. Không coi “đã kết nối OAuth” là “chắc chắn tự đăng
mỗi ngày không cần can thiệp”. Nếu phiên bản ChatGPT của bạn không cho phép
unattended write, cần scheduler/backend riêng, không đưa password vào prompt.

Khóa tài khoản hoặc thu hồi toàn bộ phiên ở admin sẽ chặn access/refresh token
MCP ngay khi kiểm tra lại. `/oauth/revoke` hỗ trợ thu hồi token theo OAuth.
Đặt `Mcp__Enabled=false` để ngắt toàn bộ MCP (không xóa bài hoặc dữ liệu Google).
OAuth reference token chỉ được chấp nhận bởi policy MCP, không dùng được với
REST JWT hay các endpoint quản trị chung. Chỉ bài công khai hoặc bài của chính
tài khoản được đọc; chỉ bài của chính tài khoản được xuất bản.

Nguồn cấu hình: [OpenAI OAuth](https://developers.openai.com/plugins/build/auth),
[Custom MCP servers](https://developers.openai.com/api/docs/guides/custom-mcp-server),
[ChatGPT automations](https://learn.chatgpt.com/docs/automations).

## 5. Kiểm tra local

```sh
dotnet test API/test/angnet.McpTests/angnet.McpTests.csproj
```

Test chạy host và SQLite riêng, khóa và tài khoản test trong bộ nhớ, không gọi
DB/Redis/Cloudinary production. Máy cần .NET 8 ASP.NET Core runtime; không dùng
major roll-forward để đánh giá behavior của ASP.NET Core 8. Sau deploy cần
kiểm tra discovery và đăng nhập từ chính giao diện ChatGPT vì bài test local
không chứng minh chính sách phê duyệt hay khả năng lập lịch của tài khoản ChatGPT.
