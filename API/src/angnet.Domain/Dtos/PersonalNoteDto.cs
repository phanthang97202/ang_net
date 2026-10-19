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
    public string? PublicToken { get; set; }
    public DateTime? PublishedAt { get; set; }
    public string? EditToken { get; set; }
}

public class PublicPersonalNoteDto
{
    public string Title { get; set; } = string.Empty;
    public string ContentJson { get; set; } = string.Empty;
}

public class PersonalNoteSaveDto
{
    public const int MaxContentLength = 8_000_000;
    [Required, StringLength(200)] public string Title { get; set; } = string.Empty;
    [Required, StringLength(MaxContentLength)] public string ContentJson { get; set; } = string.Empty;
    [Range(0, int.MaxValue - 1)] public int Version { get; set; }
}

public class PersonalNotePublishDto : PersonalNoteSaveDto
{
    public bool AllowEditing { get; set; }
}

public class SharedPersonalNoteDto : PublicPersonalNoteDto
{
    public int Version { get; set; }
}
