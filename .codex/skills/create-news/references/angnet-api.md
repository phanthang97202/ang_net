# Lưu bài trên ang_net

Đọc reference này khi được yêu cầu tạo/sửa/lưu bài qua API. Không gọi API ghi khi chỉ đang viết, đánh giá hoặc đóng gói skill.

## Căn cứ và môi trường

- Repo: `F:/Java + Angular/ang_net`.
- Website production: `https://phanthang.site`.
- API production ở thời điểm tạo skill: `https://ang-net.onrender.com/api/`.
- Trước khi dùng, xác nhận môi trường từ `Client/src/environments/environment.prod.ts` hoặc môi trường người dùng chọn; không tự chuyển giữa local và production.
- Đối chiếu contract tại `API/src/angnet.Domain/Dtos/NewsDto.cs`, `UpdateNewsDto.cs`, `LoginDto.cs`; controller `NewsController.cs`, `NewsCategoryController.cs`, `AccountController.cs`; repository `API/src/angnet.Infrastructure/Data/Repositories/NewsRespository.cs`.

## Đăng nhập và tác giả

- Dùng thông tin do người dùng cấp cho tác vụ hoặc cơ chế xác thực được phê duyệt. Không lưu credential/token trong skill, repo, payload bài, log hoặc câu trả lời.
- API username/password hiện dùng `POST Account/login`, body `{ "Email": "identifier", "Password": "password" }`. Trường legacy `Email` nhận cả username không có `@` lẫn email.
- Chỉ lấy bearer token khi `Success === true` và `Data.AccessToken` có giá trị. Gửi `Authorization: Bearer ...` trên request cần quyền.
- Không in toàn bộ response đăng nhập/exception/request headers vì có thể chứa bí mật. Đọc credential qua cơ chế an toàn; giữ token trong bộ nhớ và xóa tham chiếu khi xong.
- Đăng nhập thất bại: dừng và báo lỗi đã lược bỏ bí mật, không đoán biến thể mật khẩu hoặc lặp thử làm khóa tài khoản.
- Người tạo bài là tài khoản đang đăng nhập, không mặc định là chủ blog. Cơ chế hiện tại không cho tài khoản khác sửa bài chỉ vì có vai trò Admin; xác minh ownership trước khi update.

## Đọc trước khi ghi

1. `GET NewsCategory/GetAllActive` → chọn `DataList[].NewsCategoryId` phù hợp. Không tự tạo danh mục mới nếu chưa được yêu cầu.
2. `GET News/Search` → kiểm tra bài liên quan và bài có thể trùng. Các tham số hiện tại: `pageIndex`, `pageSize`, `keyword`, `userId`, `categoryId`, `onlyPublished`, `hashTag`. URL-encode giá trị.
3. Bài cho internal link lấy từ kết quả public đã xuất bản, không bắt buộc lấy cùng danh mục nếu thực sự liên quan. Route hiện tại: `/news/{CategoryNewsId}/{NewsId}`.
4. Khi kiểm tra bản nháp của tài khoản, dùng bearer và `onlyPublished=false`; không coi API Search vô danh là quyền xem/sửa bản nháp.

Search trả `objResult.DataList`; danh mục trả `DataList`; không giả định mọi endpoint có cùng cấu trúc response.

## Payload

`POST News/Create` cần quyền `blog.create`. `POST News/Update` cần `blog.update` và ownership, thêm `NewsId` vào payload.

```json
{
  "Thumbnail": "https://example.com/permitted-image.webp",
  "CategoryNewsId": "existing-category-id",
  "ShortTitle": "Tiêu đề tiếng Việt",
  "ShortTitleEn": "English title",
  "ShortDescription": "Mô tả tiếng Việt",
  "ShortDescriptionEn": "English description",
  "ContentBody": "<p>Mở bài tiếng Việt.</p><h2>Mục chính</h2><p>Nội dung.</p>",
  "ContentBodyEn": "<p>English introduction.</p><h2>Main section</h2><p>Content.</p>",
  "FlagActive": false,
  "WhoCanSee": "Private",
  "LstHashTagNews": [{ "HashTagNewsName": "Từ khóa" }],
  "LstHashTagNewsEn": [{ "HashTagNewsName": "Keyword" }],
  "LstRefFileNews": []
}
```

- Thay mọi giá trị ví dụ bằng nội dung đã kiểm tra; không gửi `example.com` hay ID mẫu thật lên API.
- Tiêu đề, mô tả và body Việt không được rỗng. Có nội dung tiếng Anh ở bất kỳ trường nào thì cả ba trường Anh phải đầy đủ; khi có hashtags Việt và bản Anh đầy đủ, gửi hashtags Anh tương ứng.
- Người dùng chọn Việt-only: để cả ba trường Anh rỗng và `LstHashTagNewsEn: []`, không điền bản dịch dở dang.
- Enum `WhoCanSee` hiện nhận `Public`, `Tenant`, `Private`; không đoán ý nghĩa Tenant hoặc thay lựa chọn xem của bài đang sửa.
- Không yêu cầu publish rõ ràng: `FlagActive=false`, `WhoCanSee="Private"`. Xuất bản public chỉ khi người dùng yêu cầu hoặc đã xác nhận phạm vi đó. Khi update bài đã tồn tại, giữ trạng thái và phạm vi ngoài phần được phép thay đổi.
- Body không chứa H1: `detail-news.component.html` render tiêu đề thành H1. HTML ngữ nghĩa dùng style `news-content`/CKEditor hiện có.
- Không giả định `ShortDescription` đã trở thành meta description ngoài web; DTO không có field riêng `MetaTitle`/`MetaDescription`. Không gửi field bịa ra hoặc tự sửa SEO frontend.
- Video YouTube đã xác minh có thể dùng iframe `class="ql-embed"`, `src="https://www.youtube.com/embed/VIDEO_ID"`, `title`, `loading="lazy"`, `allowfullscreen`, kèm link watch trực tiếp. Không đặt iframe trang watch thông thường.
- PowerShell gửi JSON tiếng Việt dưới dạng byte UTF-8 và `Content-Type: application/json; charset=utf-8` để tránh hỏng dấu. Không dùng shell quoting có thể thực thi backtick hoặc `$()` trong nội dung bài.

## Xác minh, chống trùng và bàn giao

- `NewsId` hiện được tạo từ slug của title Việt. Trùng tiêu đề có thể trả `News_Create.ShortTitleIsExist`; không tự đổi title chỉ để lách tạo thêm.
- Create có thể trả `Success=true` mà không kèm bản ghi/ID. Sau ghi, tìm lại đúng bài theo title và tài khoản; xác nhận ID, trạng thái, phạm vi, hai bản ngôn ngữ, thumbnail và link đã lưu. Nếu Search không có body, dùng endpoint đọc phù hợp với quyền để kiểm tra; không xem được thì báo rõ giới hạn.
- Request ghi timeout/lỗi mạng có thể đã commit. Đọc lại trước khi cân nhắc retry; không POST Create lần hai ngay. Khi chưa xác định được kết quả sau đọc an toàn, dừng và báo trạng thái chưa chắc chắn.
- Bài trùng đã tồn tại: không ghi đè nếu yêu cầu chỉ tạo mới. Update bài cụ thể chỉ trong phạm vi người dùng yêu cầu; bảo toàn dữ liệu không được yêu cầu sửa.
- Link edit hiện tại: `https://phanthang.site/dashboard/blog/edit/{NewsId}`. Nêu tài khoản tạo bài khi cần để người dùng mở đúng quyền.
- Cuối tác vụ báo ngắn: title, danh mục, draft/published, quyền xem, link edit; việc đã kiểm tra và thiếu sót (nguồn/ảnh/internal links/bản dịch) nếu còn. Không hứa đã index, đạt SEO score hoặc thứ hạng.
