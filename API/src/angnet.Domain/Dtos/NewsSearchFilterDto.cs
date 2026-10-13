namespace angnet.Domain.Dtos;

public class NewsSearchFilterDto
{
    public bool TitleOnly { get; set; }
    public DateTimeOffset? CreatedFrom { get; set; }
    // Exclusive upper bound lets callers include the entire final local calendar day.
    public DateTimeOffset? CreatedBefore { get; set; }
    public bool? IsPinned { get; set; }
    public bool? Published { get; set; }
}

public class NewsAuthorDto
{
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}
