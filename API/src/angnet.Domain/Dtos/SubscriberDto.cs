using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Dtos
{
    public class SubscribeRequestDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }

    public class SubscribeResultDto
    {
        public string Email { get; set; } = string.Empty;

        // true khi email này đã đăng ký từ trước. Client hiện cùng một màn "thành
        // công" cho cả hai trường hợp - nói thẳng "email này đã đăng ký rồi" là để
        // người lạ dò được ai đang theo dõi blog.
        public bool AlreadySubscribed { get; set; }
    }

    // Một dòng trong bảng quản trị. Không trả UnsubscribeToken: nó là thứ cho phép
    // huỷ đăng ký mà không cần đăng nhập, không có lý do gì để nó ra tới client.
    public class SubscriberItemDto
    {
        public string SubscriberId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool FlagActive { get; set; } // false = đã huỷ đăng ký
        public DateTime CreatedDTime { get; set; }
        public DateTime? UnsubscribedDTime { get; set; }
    }
}
