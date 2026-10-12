using System.Security.Cryptography;
using angnet.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.IdentityModel.Tokens;
using ModelContextProtocol.Server;
using OpenIddict.Abstractions;
using OpenIddict.Validation.AspNetCore;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace angnet.WebApi.Mcp;

public static class BlogMcpConfiguration
{
    public static BlogMcpOptions AddBlogMcp(this WebApplicationBuilder builder)
    {
        var settings = builder.Configuration.GetSection("Mcp").Get<BlogMcpOptions>() ?? new();
        builder.Services.AddSingleton(settings);
        builder.Services.AddScoped<BlogMcpAccess>();
        builder.Services.AddAntiforgery(options => options.Cookie.SameSite = SameSiteMode.Strict);
        if (!settings.Enabled) return settings;
        Validate(settings, builder.Environment.IsDevelopment());
        builder.Services.AddScoped<IAuthorizationHandler, BlogMcpAuthorizationHandler>();
        builder.Services.AddAuthorization(options => options.AddPolicy(BlogMcpOptions.Policy, policy =>
        {
            policy.AddAuthenticationSchemes(OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme);
            policy.RequireAuthenticatedUser();
            policy.AddRequirements(new BlogMcpRequirement());
        }));
        builder.Services.AddOpenIddict()
            .AddCore(options => options.UseEntityFrameworkCore().UseDbContext<AppDbContext>())
            .AddServer(options =>
            {
                options.SetIssuer(new Uri(settings.Issuer));
                options.SetConfigurationEndpointUris("/.well-known/oauth-authorization-server");
                options.SetJsonWebKeySetEndpointUris("/oauth/jwks");
                options.SetAuthorizationEndpointUris("/oauth/authorize");
                options.SetTokenEndpointUris("/oauth/token");
                options.SetRevocationEndpointUris("/oauth/revoke");
                options.AllowAuthorizationCodeFlow().AllowRefreshTokenFlow();
                options.RequireProofKeyForCodeExchange();
                options.Configure(configuration =>
                {
                    configuration.CodeChallengeMethods.Clear();
                    configuration.CodeChallengeMethods.Add(CodeChallengeMethods.Sha256);
                });
                options.RegisterScopes(BlogMcpOptions.ReadScope, BlogMcpOptions.WriteScope, BlogMcpOptions.PublishScope);
                options.RegisterResources(settings.Resource);
                options.UseReferenceAccessTokens().UseReferenceRefreshTokens();
                options.SetAccessTokenLifetime(TimeSpan.FromMinutes(15));
                options.SetRefreshTokenLifetime(TimeSpan.FromDays(30));
                if (builder.Environment.IsDevelopment() && string.IsNullOrEmpty(settings.SigningKey))
                    options.AddDevelopmentSigningCertificate().AddDevelopmentEncryptionCertificate();
                else
                {
                    var rsa = BlogMcpKeys.ReadSigningKey(settings.SigningKey);
                    options.AddSigningKey(new RsaSecurityKey(rsa)
                    {
                        KeyId = Convert.ToHexString(SHA256.HashData(rsa.ExportSubjectPublicKeyInfo()))[..16]
                    });
                    options.AddEncryptionKey(new SymmetricSecurityKey(BlogMcpKeys.ReadEncryptionKey(settings.EncryptionKey)));
                }
                var host = options.UseAspNetCore().EnableAuthorizationEndpointPassthrough().EnableTokenEndpointPassthrough();
                if (builder.Environment.IsDevelopment()) host.DisableTransportSecurityRequirement();
            })
            .AddValidation(options =>
            {
                options.UseLocalServer();
                options.AddAudiences(settings.Resource);
                options.EnableTokenEntryValidation();
                options.EnableAuthorizationEntryValidation();
                options.UseAspNetCore();
            });
        builder.Services.AddMcpServer().WithHttpTransport(options => options.Stateless = true)
            .WithTools<BlogMcpTools>();
        return settings;
    }

    public static void Validate(BlogMcpOptions settings, bool development)
    {
        if (!Uri.TryCreate(settings.Issuer, UriKind.Absolute, out var issuer)
            || issuer.Query != "" || issuer.Fragment != "" || issuer.UserInfo != "" || issuer.AbsolutePath != "/"
            || (issuer.Scheme != "https" && !(development && issuer.IsLoopback)))
            throw new InvalidOperationException("Mcp:Issuer must be an HTTPS origin ending in '/'.");
        settings.Issuer = issuer.AbsoluteUri;
        if (!Uri.TryCreate(settings.BlogUrl, UriKind.Absolute, out var blog) || blog.Scheme != "https"
            || blog.UserInfo != "" || blog.Query != "" || blog.Fragment != "")
            throw new InvalidOperationException("Mcp:BlogUrl must be an HTTPS blog URL.");
        if (settings.RedirectUris is not { Length: > 0 } || settings.RedirectUris.Any(url =>
            !Uri.TryCreate(url, UriKind.Absolute, out var redirect) || redirect.Scheme != "https"
            || redirect.Host != "chatgpt.com" || !redirect.IsDefaultPort || redirect.UserInfo != ""
            || redirect.Query != "" || redirect.Fragment != ""
            || !(redirect.AbsolutePath == "/connector_platform_oauth_redirect"
                || redirect.AbsolutePath.StartsWith("/connector/oauth/", StringComparison.Ordinal))))
            throw new InvalidOperationException("Configure exact HTTPS ChatGPT OAuth callback URLs; wildcards are not supported.");
        if (!development || !string.IsNullOrEmpty(settings.SigningKey))
        {
            using var rsa = BlogMcpKeys.ReadSigningKey(settings.SigningKey);
            var encryption = BlogMcpKeys.ReadEncryptionKey(settings.EncryptionKey);
            CryptographicOperations.ZeroMemory(encryption);
        }
    }

    public static async Task InitializeBlogMcp(this WebApplication app, BlogMcpOptions settings)
    {
        if (!settings.Enabled) return;
        await using var scope = app.Services.CreateAsyncScope();
        var manager = scope.ServiceProvider.GetRequiredService<IOpenIddictApplicationManager>();
        var descriptor = new OpenIddictApplicationDescriptor
        {
            ClientId = BlogMcpOptions.ClientId,
            ClientType = ClientTypes.Public,
            ConsentType = ConsentTypes.Explicit,
            DisplayName = "ChatGPT — Phan Thang Blog"
        };
        foreach (var url in settings.RedirectUris) descriptor.RedirectUris.Add(new Uri(url));
        descriptor.Permissions.UnionWith([
            Permissions.Endpoints.Authorization, Permissions.Endpoints.Token, Permissions.Endpoints.Revocation,
            Permissions.GrantTypes.AuthorizationCode, Permissions.GrantTypes.RefreshToken,
            Permissions.ResponseTypes.Code,
            Permissions.Prefixes.Resource + settings.Resource,
            Permissions.Prefixes.Scope + BlogMcpOptions.ReadScope,
            Permissions.Prefixes.Scope + BlogMcpOptions.WriteScope,
            Permissions.Prefixes.Scope + BlogMcpOptions.PublishScope
        ]);
        descriptor.Requirements.Add(Requirements.Features.ProofKeyForCodeExchange);
        var client = await manager.FindByClientIdAsync(BlogMcpOptions.ClientId);
        if (client is null) await manager.CreateAsync(descriptor);
        else await manager.UpdateAsync(client, descriptor);
    }

    public static void UseBlogMcp(this WebApplication app, BlogMcpOptions settings)
    {
        if (!settings.Enabled) return;
        app.Use(async (context, next) =>
        {
            var isMcp = context.Request.Path.StartsWithSegments("/mcp");
            var isOAuth = context.Request.Path.StartsWithSegments("/oauth");
            if (isMcp || isOAuth)
            {
                var limit = isMcp ? 2_000_000L : 16_384L;
                if (context.Request.ContentLength > limit)
                {
                    context.Response.StatusCode = StatusCodes.Status413PayloadTooLarge;
                    return;
                }
                if (context.Features.Get<IHttpMaxRequestBodySizeFeature>() is { IsReadOnly: false } body)
                    body.MaxRequestBodySize = limit;
            }
            if (isMcp)
            {
                // Browser requests must come from an explicitly trusted origin; server-to-server clients have no Origin.
                var origins = context.Request.Headers.Origin;
                if (origins.Count != 0 && (origins.Count != 1 ||
                    (origins[0] != "https://chatgpt.com" && origins[0] != settings.Issuer.TrimEnd('/'))))
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return;
                }
                context.Response.OnStarting(() =>
                {
                    context.Response.Headers.CacheControl = "no-store";
                    if (context.Response.StatusCode == StatusCodes.Status401Unauthorized)
                        context.Response.Headers.WWWAuthenticate =
                            $"Bearer resource_metadata=\"{settings.Issuer}.well-known/oauth-protected-resource\"";
                    return Task.CompletedTask;
                });
            }
            await next();
        });
    }

    public static void MapBlogMcp(this WebApplication app, BlogMcpOptions settings)
    {
        if (!settings.Enabled) return;
        object Metadata() => new
        {
            resource = settings.Resource,
            authorization_servers = new[] { settings.Issuer },
            scopes_supported = new[] { BlogMcpOptions.ReadScope, BlogMcpOptions.WriteScope, BlogMcpOptions.PublishScope },
            bearer_methods_supported = new[] { "header" }
        };
        app.MapGet("/.well-known/oauth-protected-resource", () => Results.Json(Metadata())).AllowAnonymous();
        app.MapGet("/.well-known/oauth-protected-resource/mcp", () => Results.Json(Metadata())).AllowAnonymous();
        app.MapMcp("/mcp").RequireAuthorization(BlogMcpOptions.Policy).RequireRateLimiting("API");
    }
}
