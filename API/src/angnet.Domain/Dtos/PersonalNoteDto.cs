using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Dtos;

public class PersonalNoteSummaryDto
{
    public string NoteId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Preview { get; set; } = string.Empty;
    public int Version { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class PersonalNoteDto : PersonalNoteSummaryDto
{
    public string ContentJson { get; set; } = string.Empty;
}

public class PersonalNoteSaveDto
{
    [Required, StringLength(200)] public string Title { get; set; } = string.Empty;
    [Required, StringLength(500_000)] public string ContentJson { get; set; } = string.Empty;
    [Range(0, int.MaxValue - 1)] public int Version { get; set; }
}
