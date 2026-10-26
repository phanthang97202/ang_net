using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using angnet.Domain.Enums;

namespace angnet.Infrastructure.Data.Services
{
    /// <summary>Metadata đáng tin của một bài, do server tự hỏi nguồn.</summary>
    public sealed class MusicTrackMetadata
    {
        public string Title { get; init; } = string.Empty;
        public string Artist { get; init; } = string.Empty;
        public string ThumbnailUrl { get; init; } = string.Empty;
        public int? DurationSeconds { get; init; }
        public string ExternalUrl { get; init; } = string.Empty;
        public string Metadata { get; init; } = "{}"; // JSON, các trường riêng của nguồn
    }

    /// <summary>Nguồn trả lời chắc chắn: bài đã xoá / riêng tư / không cho phát nhúng.</summary>
    public sealed class MusicTrackUnavailableException : Exception
    {
        public MusicTrackUnavailableException() : base("Bài hát không còn khả dụng ở nguồn") { }
    }

    /*
        Mỗi nguồn phát nhạc là một IMusicTrackSource. Thêm nguồn mới:
          1. Thêm giá trị vào EMusicProvider.
          2. Viết một class implement interface này và đăng ký trong DependencyInjection.
          3. Thêm adapter phát nhạc tương ứng ở client.
        Không phải đổi bảng nào.

        Tên, ca sĩ, ảnh luôn lấy từ nguồn chứ không nhận từ client: bảng MusicTrack
        dùng chung, tin client thì một người có thể đổi tên bài hiển thị cho mọi
        người khác đã lưu bài đó.
    */
    public interface IMusicTrackSource
    {
        EMusicProvider Provider { get; }
        bool IsValidExternalId(string externalId);
        Task<MusicTrackMetadata> FetchAsync(string externalId, CancellationToken cancellationToken);
    }

    internal static class MusicTrackSourceHttp
    {
        public const int TitleMaxLength = 300;
        public const int ArtistMaxLength = 200;
        private const int UrlMaxLength = 2048;

        public static HttpClient CreateClient(IHttpClientFactory clients)
        {
            HttpClient client = clients.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            client.MaxResponseContentBufferSize = 1024 * 1024;
            return client;
        }

        public static string Clip(string value, int length)
        {
            value = (value ?? string.Empty).Trim();
            return value.Length <= length ? value : value[..length];
        }

        public static string Text(JsonElement element, string name) =>
            element.ValueKind == JsonValueKind.Object
            && element.TryGetProperty(name, out JsonElement value)
            && value.ValueKind == JsonValueKind.String
                ? value.GetString() ?? string.Empty
                : string.Empty;

        // Chỉ giữ link https hợp lệ; ảnh từ nguồn ngoài vẫn có thể là bất cứ gì
        public static string Https(string value) =>
            value.Length <= UrlMaxLength
            && Uri.TryCreate(value, UriKind.Absolute, out Uri uri)
            && uri.Scheme == Uri.UriSchemeHttps
            && string.IsNullOrEmpty(uri.UserInfo)
                ? uri.AbsoluteUri
                : string.Empty;
    }

    /// <summary>
    /// YouTube: dùng oEmbed - không cần API key và không tốn quota Data API
    /// (search.list đã tốn 100 unit mỗi lần). oEmbed trả 401/403 khi video chặn
    /// nhúng và 400/404 khi video không tồn tại / riêng tư.
    /// </summary>
    public sealed class YouTubeMusicTrackSource : IMusicTrackSource
    {
        private static readonly Regex VideoIdPattern = new Regex("^[A-Za-z0-9_-]{11}$", RegexOptions.Compiled);
        private readonly IHttpClientFactory _clients;

        public YouTubeMusicTrackSource(IHttpClientFactory clients)
        {
            _clients = clients;
        }

        public EMusicProvider Provider => EMusicProvider.YouTube;

        public bool IsValidExternalId(string externalId) =>
            !string.IsNullOrEmpty(externalId) && VideoIdPattern.IsMatch(externalId);

        public async Task<MusicTrackMetadata> FetchAsync(string externalId, CancellationToken cancellationToken)
        {
            string watchUrl = $"https://www.youtube.com/watch?v={externalId}";
            using HttpClient client = MusicTrackSourceHttp.CreateClient(_clients);
            using HttpResponseMessage response = await client.GetAsync(
                $"https://www.youtube.com/oembed?format=json&url={Uri.EscapeDataString(watchUrl)}", cancellationToken);

            if (response.StatusCode is HttpStatusCode.BadRequest or HttpStatusCode.Unauthorized
                or HttpStatusCode.Forbidden or HttpStatusCode.NotFound)
            {
                throw new MusicTrackUnavailableException();
            }
            response.EnsureSuccessStatusCode();

            using JsonDocument document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
            JsonElement root = document.RootElement;
            string title = MusicTrackSourceHttp.Text(root, "title");
            if (string.IsNullOrWhiteSpace(title))
            {
                throw new MusicTrackUnavailableException();
            }

            return new MusicTrackMetadata
            {
                Title = MusicTrackSourceHttp.Clip(title, MusicTrackSourceHttp.TitleMaxLength),
                Artist = MusicTrackSourceHttp.Clip(MusicTrackSourceHttp.Text(root, "author_name"), MusicTrackSourceHttp.ArtistMaxLength),
                // Ảnh dựng từ videoId, không phụ thuộc link nguồn trả về
                ThumbnailUrl = $"https://i.ytimg.com/vi/{externalId}/hqdefault.jpg",
                DurationSeconds = null,
                ExternalUrl = watchUrl,
                Metadata = JsonSerializer.Serialize(new
                {
                    authorUrl = MusicTrackSourceHttp.Https(MusicTrackSourceHttp.Text(root, "author_url")),
                }),
            };
        }
    }

    /// <summary>Audius: API công khai /v1/tracks/{id}, không cần key.</summary>
    public sealed class AudiusMusicTrackSource : IMusicTrackSource
    {
        private const string ApiUrl = "https://api.audius.co/v1";
        private static readonly Regex TrackIdPattern = new Regex("^[A-Za-z0-9]{1,32}$", RegexOptions.Compiled);
        private readonly IHttpClientFactory _clients;

        public AudiusMusicTrackSource(IHttpClientFactory clients)
        {
            _clients = clients;
        }

        public EMusicProvider Provider => EMusicProvider.Audius;

        public bool IsValidExternalId(string externalId) =>
            !string.IsNullOrEmpty(externalId) && TrackIdPattern.IsMatch(externalId);

        public async Task<MusicTrackMetadata> FetchAsync(string externalId, CancellationToken cancellationToken)
        {
            using HttpClient client = MusicTrackSourceHttp.CreateClient(_clients);
            using HttpResponseMessage response = await client.GetAsync(
                $"{ApiUrl}/tracks/{Uri.EscapeDataString(externalId)}", cancellationToken);

            if (response.StatusCode is HttpStatusCode.BadRequest or HttpStatusCode.NotFound)
            {
                throw new MusicTrackUnavailableException();
            }
            response.EnsureSuccessStatusCode();

            using JsonDocument document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
            if (!document.RootElement.TryGetProperty("data", out JsonElement track)
                || track.ValueKind != JsonValueKind.Object)
            {
                throw new MusicTrackUnavailableException();
            }

            string title = MusicTrackSourceHttp.Text(track, "title");
            bool deleted = track.TryGetProperty("is_delete", out JsonElement isDelete) && isDelete.ValueKind == JsonValueKind.True;
            bool notStreamable = track.TryGetProperty("is_streamable", out JsonElement isStreamable) && isStreamable.ValueKind == JsonValueKind.False;
            if (string.IsNullOrWhiteSpace(title) || deleted || notStreamable)
            {
                throw new MusicTrackUnavailableException();
            }

            JsonElement user = track.TryGetProperty("user", out JsonElement value) ? value : default;
            JsonElement artwork = track.TryGetProperty("artwork", out JsonElement art) ? art : default;
            string artist = MusicTrackSourceHttp.Text(user, "name");
            string handle = MusicTrackSourceHttp.Text(user, "handle");
            string permalink = MusicTrackSourceHttp.Text(track, "permalink");
            int? duration = track.TryGetProperty("duration", out JsonElement d) && d.TryGetInt32(out int seconds) && seconds > 0
                ? seconds
                : null;

            return new MusicTrackMetadata
            {
                Title = MusicTrackSourceHttp.Clip(title, MusicTrackSourceHttp.TitleMaxLength),
                Artist = MusicTrackSourceHttp.Clip(string.IsNullOrWhiteSpace(artist) ? handle : artist, MusicTrackSourceHttp.ArtistMaxLength),
                ThumbnailUrl = MusicTrackSourceHttp.Https(MusicTrackSourceHttp.Text(artwork, "480x480"))
                    is { Length: > 0 } medium ? medium : MusicTrackSourceHttp.Https(MusicTrackSourceHttp.Text(artwork, "150x150")),
                DurationSeconds = duration,
                // permalink của Audius là đường dẫn tương đối dạng /handle/slug
                ExternalUrl = permalink.StartsWith('/') && !permalink.StartsWith("//", StringComparison.Ordinal)
                    ? MusicTrackSourceHttp.Https("https://audius.co" + permalink)
                    : string.Empty,
                Metadata = JsonSerializer.Serialize(new
                {
                    genre = MusicTrackSourceHttp.Clip(MusicTrackSourceHttp.Text(track, "genre"), 100),
                    handle = MusicTrackSourceHttp.Clip(handle, 100),
                }),
            };
        }
    }
}
