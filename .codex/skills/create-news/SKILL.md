---
name: create-news
description: Soạn và biên tập bài viết cho Phan Thang Blog theo UX, Search Intent, E-E-A-T và SEO on-page, mặc định song ngữ Việt-Anh. Dùng khi yêu cầu viết bài blog, cảm nhận, hướng dẫn hoặc chuẩn bị/lưu bài qua API ang_net; không dùng để sửa giao diện hay cấu hình SEO của website.
---

# Create News

Viết bài hữu ích, có giọng riêng, dễ đọc và đúng sự thật cho Phan Thang Blog. Tối ưu tìm kiếm để giúp người đọc tìm đúng nội dung, không viết chỉ để lấp checklist hay hứa hẹn thứ hạng Google.

## Xác định đầu ra và quyền thao tác

- Dựa vào yêu cầu để xác định chủ đề, độc giả, từ khóa chính, ý định tìm kiếm, giọng văn và nguồn người dùng cung cấp. Chỉ hỏi khi thiếu thông tin thực sự ảnh hưởng kết quả.
- Mặc định chuẩn bị hai bản Việt-Anh hoàn chỉnh. Nếu người dùng yêu cầu chỉ một ngôn ngữ, ưu tiên lựa chọn đó.
- Yêu cầu viết bài không mặc nhiên cho phép ghi production. Chỉ đăng nhập và gọi API ghi khi người dùng yêu cầu tạo/lưu/chỉnh bài trên blog và cung cấp quyền truy cập phù hợp.
- Khi được yêu cầu lưu nhưng chưa yêu cầu xuất bản, lưu bản nháp riêng tư. Không xuất bản, ghim, gửi thông báo hoặc sửa bài khác chỉ để hoàn tất checklist.
- Với việc lưu/sửa qua API, đọc [references/angnet-api.md](references/angnet-api.md) trước khi thao tác. Đối chiếu mã nguồn hiện tại vì contract có thể thay đổi.

## 1. Search Intent và cấu trúc bài

- Nhận diện nhu cầu tìm thông tin, so sánh, mua hàng hay tìm đúng một trang. Với bài cảm nhận, ưu tiên góc nhìn và trải nghiệm đọc, không ép thành bài hướng dẫn hay quảng cáo.
- Chọn từ khóa chính và vài chủ đề/từ khóa phụ thực sự liên quan. Tìm kiếm nguồn mới khi nội dung cần kiểm chứng hoặc người dùng yêu cầu nghiên cứu; không lấy bài đứng đầu làm mẫu để sao chép.
- Mở bài trả lời hoặc cho thấy ngay giá trị/góc nhìn chính. Đưa từ khóa chính vào khoảng 100 từ đầu nếu tự nhiên, không kéo dài lời dẫn để đủ số từ.
- Viết đủ sâu để giải quyết nhu cầu đã hứa trong tiêu đề. Không ấn định số chữ, số mục, bảng hay FAQ cho mọi bài.
- Kết bài chốt ý có ích. Không thêm lời kêu gọi chung chung, đoạn quảng bá hoặc câu hỏi tương tác không liên quan.

## 2. E-E-A-T, nguồn và tính nguyên bản

- Phân biệt dữ kiện có thể kiểm chứng với nhận xét/cảm nhận. Dẫn nguồn gần dữ kiện, ưu tiên tác giả, nhà phát hành, tài liệu chính thức, nghiên cứu gốc hoặc cơ quan đáng tin.
- Không bịa trải nghiệm thực tế, chuyến đi, việc sử dụng sản phẩm, phỏng vấn, số liệu, chứng chỉ hoặc thẩm định chuyên gia. Chỉ viết trải nghiệm ngôi thứ nhất dựa trên thông tin người dùng thực sự cung cấp; có thể thể hiện góc nhìn biên tập mà không dựng chuyện.
- Diễn đạt và phân tích bằng lời riêng, đóng góp giá trị thay vì thay từ của bài nguồn. Không tuyên bố đã kiểm tra đạo văn nếu chưa dùng công cụ phù hợp; ngay cả khi có công cụ cũng không bảo đảm tuyệt đối.
- Không tự nhận đã xem/nghe media nếu chỉ truy cập được mô tả hoặc metadata. Xin file/phụ đề khi nội dung media là căn cứ thiết yếu nhưng không truy cập được.
- Với lời bài hát có bản quyền không do người dùng cung cấp: chỉ trích tối đa 10 từ từ cùng bài hát, kèm bản dịch ngắn tương ứng; không chép/dịch toàn bộ hoặc tái tạo bằng cách diễn giải từng dòng. Có thể phân tích chủ đề và dẫn nguồn nghe/lời chính thức.
- Tác giả và quyền sở hữu bài do tài khoản tạo bài xác định. Không thêm tiểu sử/tư cách chuyên gia giả. Trang liên hệ, chính sách và SEO hạ tầng là việc của website; báo thiếu khi cần, không tự tạo/sửa chúng trong tác vụ viết bài.
- E-E-A-T là khung đánh giá độ tin cậy, không phải một điểm số hay yếu tố xếp hạng riêng mà bài viết có thể bảo đảm đạt.

## 3. SEO on-page thực dụng

- **Title:** chứa từ khóa chính, đặt gần đầu khi hợp lý, rõ ràng và đúng nội dung; ưu tiên khoảng 50–60 ký tự, nhưng không làm méo tiêu đề để đạt con số. Đây là mục tiêu biên tập, Google cắt theo không gian hiển thị chứ không áp giới hạn ký tự cố định.
- **Description:** viết tóm tắt độc lập, hấp dẫn nhưng không giật tít; nhắm khoảng 150–160 ký tự và dùng từ khóa tự nhiên. Không bảo đảm Google sẽ dùng nguyên văn mô tả này.
- **Headings:** trang bài có một H1 do tiêu đề của hệ thống render. Không đặt thêm H1 trong HTML nội dung; bắt đầu các mục từ H2, dùng H3 khi có mục con thật sự, không nhảy cấp để chỉnh cỡ chữ.
- **Keywords:** ưu tiên thuật ngữ/từ đồng nghĩa đúng ngữ cảnh. Không lặp để ép mật độ 1–2%; không coi “LSI keywords” là yêu cầu kỹ thuật của Google. Loại câu lặp vô ích và keyword stuffing.
- **Internal links:** nhắm 2–3 bài đã xuất bản, thực sự liên quan trên blog, chèn bằng anchor mô tả ý nghĩa. Xác minh URL, danh mục và khả năng truy cập; không liên kết bản nháp riêng tư cho độc giả công khai. Nếu kho chưa đủ bài liên quan, dùng số link phù hợp và báo thiếu, không bịa URL hoặc chèn bài khác chủ đề để đủ quota.
- **External links:** dẫn trực tiếp tới tài liệu hỗ trợ nhận định. Ưu tiên nguồn gốc thay vì mặc định Wikipedia hay báo lớn. Link mở tab mới có `rel="noopener noreferrer"`.
- Không khẳng định bounce rate, dwell time hoặc tỷ lệ cuộn là điểm SEO trực tiếp có công thức. Dùng chúng làm thông tin UX nếu thực sự có dữ liệu.
- `ShortTitle`/`ShortDescription` là nội dung cho title/mô tả, không tự chứng minh website đã render meta, canonical, hreflang hay schema đúng. Nếu cần đánh giá SEO kỹ thuật, báo riêng; không sửa code trong phạm vi skill này.

## 4. Readability và media

- Đoạn thường khoảng 2–4 câu; có thể ngắn hơn khi cần nhấn ý. Giọng văn tự nhiên, cụ thể, tránh câu sáo, lời dẫn rườm rà và tự khen nội dung.
- Dùng in đậm/in nghiêng tiết chế. Danh sách để nhóm mục; bảng để so sánh/tổng hợp; blockquote cho trích dẫn hoặc ghi chú. Không thêm chỉ để trang trông “chuẩn SEO”.
- Khi lưu vào blog, dùng HTML ngữ nghĩa tương thích CKEditor: `p`, `h2`, `h3`, `ul`, `ol`, `strong`, `em`, `blockquote`, `a`, `figure`, `img`, `table` và embed được hệ thống hỗ trợ. Không gửi Markdown trong `ContentBody`.
- Không đưa CSS/font inline, script hay event handler vào nội dung. Dùng typography hiện hành của blog, không tạo thêm style riêng cho từng bài.
- Hình ảnh có quyền sử dụng hoặc người dùng cho phép; mô tả đúng bằng alt ở ngôn ngữ tương ứng. Chỉ đưa từ khóa vào alt nếu ảnh thực sự liên quan; ảnh trang trí dùng alt rỗng.
- Khi có quyền xử lý file, ưu tiên WebP/AVIF, kích thước vừa đủ và mục tiêu khoảng dưới 150 KB nếu không mất chất lượng cần thiết. Với ảnh URL ngoài, không tuyên bố đã tối ưu dung lượng nếu chưa đo hoặc không kiểm soát file.
- Không tự upload Cloudinary chỉ vì cần ảnh. Ưu tiên URL được phép dùng nếu phù hợp giới hạn lưu trữ; không lấy một ảnh tìm trên mạng làm bằng chứng trải nghiệm cá nhân.
- Video có title, link trực tiếp để dự phòng, nguồn được xác minh; không autoplay hoặc nhúng URL trang thường vào iframe nếu nhà cung cấp yêu cầu URL embed.

## 5. Song ngữ và bàn giao

- Viết hai phiên bản tự nhiên, cùng ý nghĩa/dữ kiện và mức độ tin cậy; bản Anh không phải bản dịch máy từng chữ hay chỉ dịch tiêu đề.
- Tách title, description, body và hashtags theo ngôn ngữ. Không đan xen hai ngôn ngữ trong một body nếu giao diện dùng nút chuyển ngôn ngữ.
- Điều chỉnh anchor và alt theo từng bản. Giữ tên riêng chính xác; kiểm tra link nội bộ bản Anh có nội dung tương ứng, không bịa slug tiếng Anh.
- Dùng ngôn ngữ người dùng trong thông báo bàn giao. Nếu chỉ soạn, trả bài hoặc artifact sẵn dùng; nếu đã lưu, trả tiêu đề, danh mục, trạng thái bản nháp/xuất bản, link chỉnh sửa và các thiếu sót còn lại. Không in token hoặc mật khẩu.

## Checklist trước khi lưu hoặc xuất bản

- [ ] Đúng Search Intent; mở bài thể hiện giá trị và có từ khóa chính tự nhiên.
- [ ] Title/description cụ thể, không giật tít, đạt mục tiêu độ dài hoặc có lý do hợp lý để khác.
- [ ] Một H1 trên trang; body chỉ H2/H3 theo cấu trúc thực tế.
- [ ] Dữ kiện được kiểm chứng, nguồn liên kết đúng; không bịa trải nghiệm hay quá mức bản quyền.
- [ ] Bài viết có đóng góp riêng, không chỉ sao chép/diễn đạt lại nguồn.
- [ ] Đoạn, nhấn mạnh, danh sách/bảng phù hợp; không áp style/font riêng.
- [ ] Ảnh có alt đúng, quyền sử dụng rõ; media/link hoạt động trong khả năng đã kiểm tra.
- [ ] Có 2–3 internal link liên quan đã xác minh, hoặc ghi rõ vì sao không đủ.
- [ ] Bản Việt và Anh đầy đủ, tương đương; hashtags đúng từng ngôn ngữ, trừ khi người dùng chọn một ngôn ngữ.
- [ ] Nếu thao tác API: đúng tài khoản/tác giả, danh mục, payload, trạng thái và quyền xem; có xác nhận lưu thực tế, không tạo trùng.

## Nguồn hướng dẫn SEO

Đối chiếu khi cần cập nhật quy tắc, không coi các mốc biên tập là cam kết xếp hạng:

- [Google: people-first content và E-E-A-T](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google: title links](https://developers.google.com/search/docs/appearance/title-link)
- [Google: snippets và meta description](https://developers.google.com/search/docs/appearance/snippet)
- [Google: SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
