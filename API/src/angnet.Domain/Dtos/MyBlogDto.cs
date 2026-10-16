namespace angnet.Domain.Dtos;

public class MyFavoritesPageDto : CursorPageInfo<RPNewsDto>
{
    public int ItemCount { get; set; }
}

public class BlogActivityDto
{
    public string ActivityId { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
    public DateTime OccurredAt { get; set; }
    public string NewsId { get; set; } = string.Empty;
    public string CategoryNewsId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string TitleEn { get; set; } = string.Empty;
    public bool HasEnglishTranslation { get; set; }
    public string? CommentId { get; set; }
    public string? CommentContent { get; set; }
    public double? Point { get; set; }
}
