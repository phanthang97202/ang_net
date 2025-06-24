using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SharedModels.Models
{
    public class ChatModel : BaseModel
    {
        [Key]
        public string MessageId { get; set; } = Guid.NewGuid().ToString();
        [ForeignKey("UserId")]
        [Required]
        public string UserId {  get; set; } = string.Empty;
        [Required]
        public string Type {  get; set; } = string.Empty; // string, txt, png, jpg, mp4, mp3
        [Required]
        public string Message { get; set; } = string.Empty; 
    }
}
