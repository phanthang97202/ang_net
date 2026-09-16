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
}
