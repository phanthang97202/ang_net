using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Metadata;
using System.Text;
using System.Threading.Tasks;

namespace angnet.Utility.CommonUtils
{
    public static partial class ConstValue
    {
        // Expired Time (phút)
        //
        // 5 phút (giá trị cũ) khiến cache gần như vô dụng: cứ 12 lần/giờ là toàn bộ
        // dữ liệu bị nạp lại từ Postgres rồi ghi ngược lên Redis Cloud đặt tận
        // Singapore, trong khi service chạy ở vùng khác - mỗi vòng như vậy tính vào
        // băng thông "Service-Initiated" của Render (đang chiếm 62% tổng lưu lượng,
        // nhiều hơn cả phần phục vụ người dùng thật).
        //
        // Để dài được vì mọi thao tác ghi (tạo/sửa/xoá bài, like, chấm điểm) đều đã
        // chủ động xoá cache liên quan, nên dữ liệu cũ không sống sót tới hết TTL.
        public const int CACHE_EXPIRED_TIME = 30;

        // News - Bài viết
        public const string NewsRespository_Search = "NewsRespository.Search";
        public const string NewsRespository_Detail = "NewsRespository.Detail";
        public const string NewsRespository_CategoryPreview = "NewsRespository.CategoryPreview";
    }
}
