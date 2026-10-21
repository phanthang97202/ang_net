using System.Text.Json;
using System.Text.RegularExpressions;
using angnet.Application.Interfaces.Services;

namespace angnet.WebApi.Cloudinary;

public class ReelMediaStorage(IConfiguration configuration, IHttpClientFactory clients, ILogger<ReelMediaStorage> logger)
    : IReelMediaStorage
{
    // Chỉ nhận namespace Reels, kể cả URL poster/transform của video và file cũ
    // chưa có thư mục user. Không suy ra public_id từ URL ngoài Cloudinary.
    private static readonly Regex DeliveryPath = new(
        @"^/(?<cloud>[A-Za-z0-9_-]+)/(?<type>image|video)/upload/(?:[^/]+/)*?(?<id>reels/(?<kind>image|video)/(?:[A-Za-z0-9_-]+/)?[A-Za-z0-9_-]+)(?:\.[A-Za-z0-9]+)?$",
        RegexOptions.CultureInvariant | RegexOptions.NonBacktracking, TimeSpan.FromSeconds(1));

    public ReelStoredFile? GetFile(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)
            || (uri.Scheme != "https" && uri.Scheme != "http")
            || !uri.Host.Equals("res.cloudinary.com", StringComparison.OrdinalIgnoreCase)
            || !string.IsNullOrEmpty(uri.UserInfo)) return null;
        var match = DeliveryPath.Match(Uri.UnescapeDataString(uri.AbsolutePath));
        if (!match.Success || match.Groups["type"].Value != match.Groups["kind"].Value) return null;
        return new(match.Groups["cloud"].Value, match.Groups["type"].Value, match.Groups["id"].Value);
    }

    public bool IsOwnedUpload(string ownerId, string url)
    {
        var file = GetFile(url);
        return file != null
            && CloudinaryAccount.TryGetSettings(configuration, out var cloud, out _, out _)
            && file.CloudName == cloud
            && file.PublicId.StartsWith($"reels/{file.ResourceType}/{ownerId}/", StringComparison.Ordinal);
    }

    public async Task<bool> DeleteAsync(IReadOnlyCollection<ReelStoredFile> files)
    {
        if (files.Count == 0) return true;
        if (!CloudinaryAccount.TryGetSettings(configuration, out var cloud, out var key, out var secret)
            || files.Any(f => f.CloudName != cloud)) return false;
        using var client = clients.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(20);
        foreach (var file in files.Distinct())
        {
            // Re-validate even internal callers before signing a permanent deletion.
            if (GetFile($"https://res.cloudinary.com/{file.CloudName}/{file.ResourceType}/upload/{file.PublicId}") != file)
                return false;
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(System.Globalization.CultureInfo.InvariantCulture);
            using var form = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["public_id"] = file.PublicId, ["timestamp"] = timestamp,
                ["api_key"] = key, ["invalidate"] = "true",
                ["signature"] = CloudinaryAccount.Sign($"invalidate=true&public_id={file.PublicId}&timestamp={timestamp}", secret),
            });
            try
            {
                using var response = await client.PostAsync(
                    $"https://api.cloudinary.com/v1_1/{Uri.EscapeDataString(cloud)}/{file.ResourceType}/destroy", form);
                if (!response.IsSuccessStatusCode) return false;
                using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
                if (json.RootElement.ValueKind != JsonValueKind.Object
                    || !json.RootElement.TryGetProperty("result", out var result)
                    || result.ValueKind != JsonValueKind.String
                    || (result.GetString() != "ok" && result.GetString() != "not found")) return false;
            }
            catch (Exception error) when (error is HttpRequestException or TaskCanceledException or JsonException)
            {
                logger.LogWarning("Reel: Cloudinary deletion failed for {PublicId} ({ErrorType})", file.PublicId, error.GetType().Name);
                return false;
            }
        }
        return true;
    }
}
