using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Models
{
    public class ChatModel
    {
        [Key]
        public string MessageId { get; set; } = Guid.NewGuid().ToString();
        [ForeignKey("UserId")]
        [Required]
        public string UserId {  get; set; } = string.Empty;
        [Required]
        public string Message { get; set; } = string.Empty;
        [Required]
        public DateTime CreatedDTime { get; set; }
    }
}
