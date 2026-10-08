namespace angnet.Domain.Dtos;

// Live catalog is independent from the retired manual store.
public class MovieLibraryItemDto
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
    public bool IsWishlisted { get; set; }
}

public class MovieLibraryCatalogDto
{
    public List<MovieLibraryItemDto> Items { get; set; } = [];
    public int Page { get; set; }
    public int TotalPages { get; set; }
    public int TotalItems { get; set; }
}

public class MovieLibraryDetailDto : MovieLibraryItemDto
{
    public string Description { get; set; } = "";
    public List<string> Genres { get; set; } = [];
    public List<MovieLibraryServerDto> Servers { get; set; } = [];
}

public class MovieLibraryServerDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public List<MovieLibraryEpisodeDto> Episodes { get; set; } = [];
}

public class MovieLibraryEpisodeDto
{
    public string Slug { get; set; } = "";
    public string Name { get; set; } = "";
    public bool HasSource { get; set; }
}

public class MovieLibraryPlaybackDto
{
    public string Title { get; set; } = "";
    public string Url { get; set; } = "";
    public string EmbedUrl { get; set; } = "";
}
