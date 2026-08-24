using System.Text.Json.Serialization;
using angnet.Domain.Enums;

namespace angnet.Domain.Dtos
{
    public class NewsCommentDto
    {
        public string CommentId { get; set; } = string.Empty;
        public string NewsId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string UserFullName { get; set; } = string.Empty;
        public string UserAvatar { get; set; } = string.Empty;
        public string ParentCommentId { get; set; } = default!;
        public string Content { get; set; } = string.Empty;

        // Tính lại lúc đọc chứ không lấy từ cột đếm sẵn trên bảng: các quy tắc ẩn
        // (tác giả bị vô hiệu hoá, bình luận bị báo cáo) đều có tính hồi tố nên
        // cột đếm ghi lúc tạo chắc chắn sẽ lệch.
        public int LikeCount { get; set; }
        public int ReplyCount { get; set; }

        public bool IsLikedByMe { get; set; }
        public bool IsOwnedByMe { get; set; }
        /// <summary>Bị ẩn (báo cáo quá ngưỡng / tác giả bị vô hiệu hoá) - Content đã được xoá trắng.</summary>
        public bool IsHidden { get; set; }

        public DateTime CreatedDTime { get; set; }

        // Vài trả lời đầu tiên, chỉ populate cho bình luận gốc. Xem thêm qua endpoint Replies.
        public List<NewsCommentDto> Replies { get; set; } = new List<NewsCommentDto>();
    }

    public class NewsCommentCreateDto
    {
        public string NewsId { get; set; } = string.Empty;
        public string ParentCommentId { get; set; } = default!;
        public string Content { get; set; } = string.Empty;
    }

    public class NewsCommentReportCreateDto
    {
        public string CommentId { get; set; } = string.Empty;
        // Client gui ten enum dang chuoi ("FakeNews"...) chu khong phai so thu tu.
        // Khong co converter nay thi System.Text.Json tu choi, request hong o buoc
        // model binding va tra ve 400 truoc khi vao controller.
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public ENewsCommentReportReason Reason { get; set; } = ENewsCommentReportReason.Other;
        public string Description { get; set; } = string.Empty;
    }
}
