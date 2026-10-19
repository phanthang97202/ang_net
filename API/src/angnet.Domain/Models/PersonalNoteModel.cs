using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models;

public class PersonalNoteModel
{
    [Key] public string NoteId { get; set; } = string.Empty;
    public string OwnerId { get; set; } = string.Empty;
    [MaxLength(200)] public string Title { get; set; } = string.Empty;
    public string ContentJson { get; set; } = string.Empty;
    public string ContentText { get; set; } = string.Empty;
    public int Version { get; set; } = 1;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    [MaxLength(64)] public string? PublicToken { get; set; }
    [MaxLength(200)] public string? PublishedTitle { get; set; }
    public string? PublishedContentJson { get; set; }
    public DateTime? PublishedAt { get; set; }
    [MaxLength(64)] public string? EditToken { get; set; }
}
