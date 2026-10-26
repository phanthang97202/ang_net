using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace angnet.WebApi.Security;

public sealed class TurnstileOptions
{
    public string SecretKey { get; set; } = "";
    // Exact frontend hostnames, separated by commas (no scheme, port or path).
    public string AllowedHostnames { get; set; } = "";
}

public enum TurnstileResult { Valid, Invalid, Unavailable }

public interface ITurnstileVerifier
{
    Task<TurnstileResult> VerifyAsync(string? token, CancellationToken cancellationToken);
}

public sealed class TurnstileVerifier(
    HttpClient client,
    IOptions<TurnstileOptions> options,
    IHostEnvironment environment,
    ILogger<TurnstileVerifier> logger) : ITurnstileVerifier
{
    public const string CommentAction = "news_comment";

    public async Task<TurnstileResult> VerifyAsync(string? token, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(token) || token.Length > 2048)
            return TurnstileResult.Invalid;

        var settings = options.Value;
        var hosts = settings.AllowedHostnames.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        // Cloudflare's public testing secrets must never enable a production bypass.
        var testSecret = settings.SecretKey is "1x0000000000000000000000000000000AA"
            or "2x0000000000000000000000000000000AA" or "3x0000000000000000000000000000000AA";
        if (string.IsNullOrWhiteSpace(settings.SecretKey) || hosts.Length == 0 || (testSecret && !environment.IsDevelopment()))
        {
            logger.LogWarning("Turnstile configuration is missing or unsuitable for this environment");
            return TurnstileResult.Unavailable;
        }

        try
        {
            using var body = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["secret"] = settings.SecretKey,
                ["response"] = token
            });
            using var response = await client.PostAsync("https://challenges.cloudflare.com/turnstile/v0/siteverify", body, cancellationToken);
            if (!response.IsSuccessStatusCode) return TurnstileResult.Unavailable;
            var result = await response.Content.ReadFromJsonAsync<SiteverifyResponse>(cancellationToken: cancellationToken);
            if (result?.success != true) return TurnstileResult.Invalid;
            var actionMatches = result.action == CommentAction || (testSecret && environment.IsDevelopment() && result.action == "test");
            return actionMatches && hosts.Contains(result.hostname, StringComparer.OrdinalIgnoreCase)
                ? TurnstileResult.Valid : TurnstileResult.Invalid;
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException ||
            (ex is OperationCanceledException && !cancellationToken.IsCancellationRequested))
        {
            // Do not log tokens, secrets or the provider's response body.
            logger.LogWarning("Turnstile verification could not complete ({ErrorType})", ex.GetType().Name);
            return TurnstileResult.Unavailable;
        }
    }

    private sealed record SiteverifyResponse(bool success, string? hostname, string? action);
}
