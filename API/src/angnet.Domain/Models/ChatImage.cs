using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models;

// Kept in a separate table so chat history and notifications never load image bytes.
public class ChatImage
{
    [Key]
    public string MessageId { get; set; } = string.Empty;
    [Required, MaxLength(32)]
    public string ContentType { get; set; } = string.Empty;
    [Required]
    public byte[] Data { get; set; } = [];
}
