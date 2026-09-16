using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models
{
    public class SubscriberModel : BaseModel
    {
        [Key]
        public string SubscriberId { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [StringLength(256)]
        public string Email { get; set; } = string.Empty; // Lưu dạng chữ thường để so trùng

        // Huỷ đăng ký thì đặt FlagActive = false chứ không xoá bản ghi: giữ lại để
        // biết người này từng đăng ký rồi huỷ, tránh gửi lại cho họ sau này.
        // Token nằm trong link huỷ gửi kèm mail, đoán không ra nên không cần đăng nhập.
        [StringLength(64)]
        public string UnsubscribeToken { get; set; } = Guid.NewGuid().ToString("N");

        public DateTime? UnsubscribedDTime { get; set; }
    }
}
