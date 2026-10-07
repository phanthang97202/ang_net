namespace angnet.Domain.Dtos;

// Live catalog is independent from the optional AniList/admin store.
public class AnimeLibraryItemDto
{
    public string Slug { get; set; } = "";
    public string Title { get; set; } = "";
    public string OriginalTitle { get; set; } = "";
    public string PosterUrl { get; set; } = "";
    public string BannerUrl { get; set; } = "";
    public int Year { get; set; }
    public string EpisodeStatus { get; set; } = "";
    public string Quality { get; set; } = "";
    public string Language { get; set; } = "";
}

public class AnimeLibraryCatalogDto
{
    public List<AnimeLibraryItemDto> Items { get; set; } = [];
    public int Page { get; set; }
    public int TotalPages { get; set; }
    public int TotalItems { get; set; }
}

public class AnimeLibraryDetailDto : AnimeLibraryItemDto
{
    public string Description { get; set; } = "";
    public List<string> Genres { get; set; } = [];
    public List<AnimeLibraryServerDto> Servers { get; set; } = [];
}

public class AnimeLibraryServerDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public List<AnimeLibraryEpisodeDto> Episodes { get; set; } = [];
}

public class AnimeLibraryEpisodeDto
{
    public string Slug { get; set; } = "";
    public string Name { get; set; } = "";
    public bool HasSource { get; set; }
}

public class AnimeLibraryPlaybackDto
{
    public string Title { get; set; } = "";
    public string Url { get; set; } = "";
    public string EmbedUrl { get; set; } = "";
}
