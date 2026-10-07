using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using Microsoft.Extensions.Caching.Memory;

namespace angnet.Infrastructure.Data.Services;

public class MovieLibraryService(IHttpClientFactory clients, IMemoryCache cache) : IMovieLibraryService
{
    private const string Endpoint = "https://phimapi.com/";
    private const int PageSize = 24;

    public async Task<MovieLibraryCatalogDto> Browse(string keyword, int page, CancellationToken cancellationToken)
    {
        keyword = (keyword ?? "").Trim();
        if (keyword.Length > 100 || page is < 1 or > 10000)
            throw new ArgumentException("Từ khóa hoặc số trang không hợp lệ.");
        string path = keyword.Length == 0
            ? $"v1/api/danh-sach?page={page}&limit={PageSize}"
            : $"v1/api/tim-kiem?keyword={Uri.EscapeDataString(keyword)}&page={page}&limit={PageSize}";
        JsonElement root = await Fetch(path, cancellationToken);
        JsonElement data = root.GetProperty("data");
        JsonElement pagination = data.GetProperty("params").GetProperty("pagination");
        string imageBase = Text(data, "APP_DOMAIN_CDN_IMAGE");
        return new MovieLibraryCatalogDto
        {
            Items = Elements(data, "items").Select(m => MapItem(m, imageBase)).ToList(),
            Page = Number(pagination, "currentPage"),
            TotalPages = Math.Max(1, Number(pagination, "totalPages")),
            TotalItems = Number(pagination, "totalItems")
        };
    }

    public async Task<MovieLibraryDetailDto> Detail(string slug, CancellationToken cancellationToken)
    {
        JsonElement root = await Movie(slug, cancellationToken);
        JsonElement movie = root.GetProperty("movie");
        MovieLibraryItemDto item = MapItem(movie, "");
        return new MovieLibraryDetailDto
        {
            Slug = item.Slug, Title = item.Title, OriginalTitle = item.OriginalTitle,
            PosterUrl = item.PosterUrl, BannerUrl = item.BannerUrl, Year = item.Year,
            Quality = item.Quality, Language = item.Language, EpisodeStatus = item.EpisodeStatus,
            Description = WebUtility.HtmlDecode(Regex.Replace(Text(movie, "content"), "<[^>]*>", " ")),
            Genres = Elements(movie, "category").Select(c => Text(c, "name")).ToList(),
            Servers = Elements(root, "episodes").Select((s, index) => new MovieLibraryServerDto
            {
                Id = index, Name = Text(s, "server_name"),
                Episodes = Elements(s, "server_data").Where(e => Text(e, "slug").Length > 0)
                    .Select(e => new MovieLibraryEpisodeDto
                    {
                        Slug = Text(e, "slug"), Name = Text(e, "name"),
                        HasSource = Https(Text(e, "link_m3u8")).Length > 0 || Embed(Text(e, "link_embed")).Length > 0
                    }).ToList()
            }).Where(s => s.Episodes.Count > 0).ToList()
        };
    }

    public async Task<MovieLibraryPlaybackDto> Playback(string slug, int server, string episode, CancellationToken cancellationToken)
    {
        if (server < 0 || string.IsNullOrWhiteSpace(episode) || episode.Length > 200)
            throw new ArgumentException("Tập phim không hợp lệ.");
        JsonElement root = await Movie(slug, cancellationToken);
        var servers = Elements(root, "episodes").ToList();
        if (server >= servers.Count) throw new KeyNotFoundException("Nguồn phát không tồn tại.");
        JsonElement selected = Elements(servers[server], "server_data").FirstOrDefault(e => Text(e, "slug") == episode);
        if (selected.ValueKind == JsonValueKind.Undefined) throw new KeyNotFoundException("Tập phim không tồn tại.");
        var result = new MovieLibraryPlaybackDto
        {
            Title = Text(selected, "name"), Url = Https(Text(selected, "link_m3u8")),
            EmbedUrl = Embed(Text(selected, "link_embed"))
        };
        if (result.Url.Length == 0 && result.EmbedUrl.Length == 0)
            throw new KeyNotFoundException("Tập phim này chưa có nguồn phát.");
        return result;
    }

    private async Task<JsonElement> Movie(string slug, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(slug) || slug.Length > 200 || !Regex.IsMatch(slug, "^[a-z0-9]+(?:-[a-z0-9]+)*$"))
            throw new ArgumentException("Mã phim không hợp lệ.");
        JsonElement root = await Fetch($"phim/{slug}", cancellationToken);
        if (!root.TryGetProperty("movie", out var movie) || movie.ValueKind != JsonValueKind.Object)
            throw new KeyNotFoundException("Không tìm thấy phim trong nguồn.");
        return root;
    }

    private async Task<JsonElement> Fetch(string path, CancellationToken cancellationToken)
    {
        string key = "movie-library:" + path;
        if (cache.TryGetValue(key, out JsonElement cached)) return cached;
        using var client = clients.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(15);
        client.MaxResponseContentBufferSize = 8 * 1024 * 1024;
        using var response = await client.GetAsync(Endpoint + path, cancellationToken);
        if (response.StatusCode == HttpStatusCode.NotFound) throw new KeyNotFoundException("Không tìm thấy phim.");
        response.EnsureSuccessStatusCode();
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        JsonElement root = document.RootElement.Clone();
        if (root.TryGetProperty("status", out var status) && status.ValueKind == JsonValueKind.False)
            throw new KeyNotFoundException("Nguồn phim chưa có dữ liệu phù hợp.");
        cache.Set(key, root, TimeSpan.FromMinutes(3));
        return root;
    }

    private static MovieLibraryItemDto MapItem(JsonElement m, string imageBase) => new()
    {
        Slug = Text(m, "slug"), Title = Text(m, "name"), OriginalTitle = Text(m, "origin_name"),
        PosterUrl = Image(Text(m, "poster_url"), imageBase), BannerUrl = Image(Text(m, "thumb_url"), imageBase),
        Year = Number(m, "year"), EpisodeStatus = Text(m, "episode_current"),
        Quality = Text(m, "quality"), Language = Text(m, "lang")
    };

    private static string Image(string value, string imageBase) => Https(
        Uri.TryCreate(value, UriKind.Absolute, out _) ? value : imageBase.TrimEnd('/') + "/" + value.TrimStart('/'));
    private static string Https(string value) => Uri.TryCreate(value, UriKind.Absolute, out var uri)
        && uri.Scheme == "https" && string.IsNullOrEmpty(uri.UserInfo) ? uri.AbsoluteUri : "";
    private static string Embed(string value) => Uri.TryCreate(Https(value), UriKind.Absolute, out var uri)
        && uri.Host == "player.phimapi.com" && uri.AbsolutePath.StartsWith("/player/", StringComparison.Ordinal) ? uri.AbsoluteUri : "";
    private static string Text(JsonElement e, string name) => e.ValueKind == JsonValueKind.Object
        && e.TryGetProperty(name, out var value) ? value.ToString() : "";
    private static int Number(JsonElement e, string name) => int.TryParse(Text(e, name), out int value) ? value : 0;
    private static IEnumerable<JsonElement> Elements(JsonElement e, string name) => e.ValueKind == JsonValueKind.Object
        && e.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.Array ? value.EnumerateArray() : [];
}
