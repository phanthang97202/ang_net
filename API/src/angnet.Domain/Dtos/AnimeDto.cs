namespace angnet.Domain.Dtos
{
    public class AnimeSearchItemDto
    {
        public int AniListId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string NativeTitle { get; set; } = string.Empty;
        public string CoverImageUrl { get; set; } = string.Empty;
        public string BannerImageUrl { get; set; } = string.Empty;
        public string Format { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int? ReleaseYear { get; set; }
        public int? EpisodeCount { get; set; }
        public int? AverageScore { get; set; }
    }

    public class AnimeDetailDto : AnimeSearchItemDto
    {
        public string Description { get; set; } = string.Empty;
        public List<string> Genres { get; set; } = new();
        public List<AnimeEpisodeDto> Episodes { get; set; } = new();
    }

    public class AnimeEpisodeDto
    {
        public int EpisodeNumber { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty;
        public int? DurationSeconds { get; set; }
        public bool HasSource { get; set; }
    }

    public class AnimePlaybackDto
    {
        public int AniListId { get; set; }
        public int EpisodeNumber { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Provider { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public bool IsEmbed { get; set; }
        public string MimeType { get; set; } = string.Empty;
    }
}
