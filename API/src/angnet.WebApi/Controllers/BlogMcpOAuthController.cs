using System.Security.Claims;
using System.Text.Encodings.Web;
using angnet.Domain.Models;
using angnet.Infrastructure.Data.Services;
using angnet.WebApi.Filters;
using angnet.WebApi.Mcp;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace angnet.WebApi.Controllers;

[AllowAnonymous, EnableRateLimiting("API"), RequestSizeLimit(16_384)]
public sealed class BlogMcpOAuthController(
    BlogMcpOptions settings, UserManager<AppUser> users, SignInManager<AppUser> signIn,
    IAntiforgery antiforgery, BlogMcpAccess access) : Controller
{
    [HttpGet("/oauth/authorize"), SkipLogging]
    public IActionResult Authorize()
    {
        if (!settings.Enabled) return NotFound();
        var request = HttpContext.GetOpenIddictServerRequest()!;
        if (!ValidResource(request)) return OAuthError(Errors.InvalidTarget, "Invalid MCP resource.");
        return LoginForm(request);
    }

    [HttpPost("/oauth/authorize"), SkipLogging]
    public async Task<IActionResult> Authorize([FromForm] string username = "", [FromForm] string password = "",
        [FromForm] string consent = "", [FromForm] string decision = "allow")
    {
        if (!settings.Enabled) return NotFound();
        try { await antiforgery.ValidateRequestAsync(HttpContext); }
        catch (AntiforgeryValidationException) { return BadRequest("Invalid authorization form. Reopen the connection page."); }
        var request = HttpContext.GetOpenIddictServerRequest()!;
        if (!ValidResource(request)) return OAuthError(Errors.InvalidTarget, "Invalid MCP resource.");
        if (decision == "deny") return OAuthError(Errors.AccessDenied, "Connection cancelled.");
        if (consent != "true") return LoginForm(request, "Bạn cần xác nhận các quyền trước khi kết nối.");
        username ??= "";
        password ??= "";
        if (username.Length > 256 || password.Length > 256) return BadRequest();
        var user = username.Contains('@') ? await users.FindByEmailAsync(username.Trim()) : await users.FindByNameAsync(username.Trim());
        if (user is null || !user.FlagActive || string.IsNullOrEmpty(password)
            || !(await signIn.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true)).Succeeded)
            return LoginForm(request, "Không thể đăng nhập. Kiểm tra tài khoản hoặc trạng thái khóa.");
        if (!await access.HasPermission(user, "mcp.connect") || !await CanGrant(user, request.GetScopes()))
            return LoginForm(request, "Tài khoản chưa được cấp quyền kết nối hoặc các quyền bài viết được yêu cầu.");

        var principal = BuildPrincipal(user, request.GetScopes());
        var applications = HttpContext.RequestServices.GetRequiredService<IOpenIddictApplicationManager>();
        var authorizations = HttpContext.RequestServices.GetRequiredService<IOpenIddictAuthorizationManager>();
        var client = await applications.FindByClientIdAsync(request.ClientId!) ?? throw new InvalidOperationException();
        var authorization = await authorizations.CreateAsync(principal, user.Id,
            await applications.GetIdAsync(client)!, AuthorizationTypes.Permanent, principal.GetScopes());
        principal.SetAuthorizationId(await authorizations.GetIdAsync(authorization));
        return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }

    [HttpPost("/oauth/token"), IgnoreAntiforgeryToken, SkipLogging]
    public async Task<IActionResult> Exchange()
    {
        if (!settings.Enabled) return NotFound();
        var request = HttpContext.GetOpenIddictServerRequest()!;
        if (!ValidResource(request)) return OAuthError(Errors.InvalidTarget, "Invalid MCP resource.");
        if (!request.IsAuthorizationCodeGrantType() && !request.IsRefreshTokenGrantType())
            return OAuthError(Errors.UnsupportedGrantType, "Only authorization code and refresh token are supported.");
        var authentication = await HttpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        if (authentication.Principal is not { } principal)
            return OAuthError(Errors.InvalidGrant, "Invalid or expired grant.");
        var user = await access.CurrentUser(principal);
        if (user is null || !await CanGrant(user, principal.GetScopes()))
            return OAuthError(Errors.InvalidGrant, "Account or permissions changed. Reconnect the blog plugin.");
        // OpenIddict retains the original grant, rotates refresh tokens and checks PKCE/replay.
        principal.SetResources(settings.Resource);
        return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }

    private bool ValidResource(OpenIddictRequest request) =>
        request.GetResources().SequenceEqual(new[] { settings.Resource }, StringComparer.Ordinal);

    private async Task<bool> CanGrant(AppUser user, IEnumerable<string> scopes)
    {
        var requested = scopes.ToHashSet(StringComparer.Ordinal);
        if (!requested.Contains(BlogMcpOptions.ReadScope)) return false;
        if (requested.Contains(BlogMcpOptions.WriteScope)
            && !await access.HasPermission(user, "blog.create") && !await access.HasPermission(user, "blog.update")) return false;
        if (requested.Contains(BlogMcpOptions.PublishScope) && !await access.HasPermission(user, "mcp.publish")) return false;
        return true;
    }

    private ClaimsPrincipal BuildPrincipal(AppUser user, IEnumerable<string> scopes)
    {
        var identity = new ClaimsIdentity(TokenValidationParameters.DefaultAuthenticationType, Claims.Name, Claims.Role);
        identity.SetClaim(Claims.Subject, user.Id);
        identity.SetClaim(ClaimTypes.NameIdentifier, user.Id);
        identity.SetClaim(Claims.Name, user.FullName ?? user.UserName ?? "Blog account");
        identity.SetClaim(BlogMcpOptions.StampClaim, user.SecurityStamp);
        identity.SetClaim(AccountSessionService.VersionClaim, user.SessionVersion.ToString(System.Globalization.CultureInfo.InvariantCulture));
        // Deliberately no Admin role/permission claims: an MCP token cannot authorize general REST actions.
        identity.SetDestinations(_ => [Destinations.AccessToken]);
        var principal = new ClaimsPrincipal(identity);
        principal.SetScopes(scopes);
        principal.SetResources(settings.Resource);
        return principal;
    }

    private ForbidResult OAuthError(string error, string description) => Forbid(new AuthenticationProperties(
        new Dictionary<string, string?>
        {
            [OpenIddictServerAspNetCoreConstants.Properties.Error] = error,
            [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = description
        }), OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);

    private ContentResult LoginForm(OpenIddictRequest request, string error = "")
    {
        Response.Headers.CacheControl = "no-store";
        // Chromium applies form-action to the OAuth redirect chain, not only the same-origin POST.
        // Permit the trusted ChatGPT callback origin; exact callback URLs are still checked by OpenIddict.
        Response.Headers.ContentSecurityPolicy = "default-src 'none'; style-src 'unsafe-inline'; form-action 'self' https://chatgpt.com; base-uri 'none'; frame-ancestors 'none'";
        var token = antiforgery.GetAndStoreTokens(HttpContext);
        static string H(string value) => HtmlEncoder.Default.Encode(value);
        IEnumerable<KeyValuePair<string, Microsoft.Extensions.Primitives.StringValues>> fields =
            Request.HasFormContentType ? Request.Form : Request.Query;
        var hidden = fields.Where(pair => pair.Key is "client_id" or "response_type" or "redirect_uri"
            or "scope" or "state" or "resource" or "code_challenge" or "code_challenge_method" or "response_mode")
            .SelectMany(pair => pair.Value.Select(value =>
                "<input type=\"hidden\" name=\"" + H(pair.Key) + "\" value=\"" + H(value ?? "") + "\">"));
        var scopes = request.GetScopes().Where(x => x != Scopes.OfflineAccess).Select(x => x switch
        {
            BlogMcpOptions.ReadScope => "Đọc danh mục và bài viết công khai / bản nháp của bạn",
            BlogMcpOptions.WriteScope => "Tạo bản nháp bài viết của bạn",
            BlogMcpOptions.PublishScope => "Xuất bản công khai bài viết của bạn",
            _ => x
        });
        return Content($$"""
            <!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
            <title>Kết nối ChatGPT — Phan Thang Blog</title>
            <style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:linear-gradient(135deg,#fffcf8,#f0edff);font:15px/1.6 system-ui;color:#242238}.card{max-width:480px;margin:24px;padding:32px;border-radius:24px;background:white;box-shadow:0 10px 40px #5b4fe915}h1{font-size:24px;margin-top:0}label{display:block;margin-top:16px}input:not([type=checkbox]){box-sizing:border-box;width:100%;padding:12px;border:1px solid #ddd;border-radius:12px;font:inherit}button{padding:12px 20px;border:0;border-radius:24px;background:#5b4fe9;color:white;font:600 14px system-ui;cursor:pointer;margin:20px 8px 0 0}.cancel{background:#f1efff;color:#5b4fe9}.error{color:#b42318}</style></head>
            <body><main class="card"><h1>Kết nối ChatGPT với blog</h1><p>Đăng nhập bằng tài khoản blog được cấp quyền MCP. Chỉ kết nối nếu bạn vừa bắt đầu thao tác này trong ChatGPT.</p>
            <ul>{{string.Join("", scopes.Select(x => "<li>" + H(x) + "</li>"))}}</ul>
            <p>Quyền truy cập có thể được thu hồi khi khóa tài khoản hoặc thu hồi phiên. Việc tự động xuất bản còn phụ thuộc quyền phê duyệt của ChatGPT.</p>
            <p class="error" role="alert">{{H(error)}}</p>
            <form method="post" action="{{H(Request.Path)}}">
            <input type="hidden" name="__RequestVerificationToken" value="{{H(token.RequestToken!)}}">
            {{string.Join("", hidden)}}
            <label for="username">Tài khoản hoặc email</label><input id="username" name="username" autocomplete="username" maxlength="256" required>
            <label for="password">Mật khẩu</label><input id="password" name="password" type="password" autocomplete="current-password" maxlength="256" required>
            <label><input type="checkbox" name="consent" value="true" required> Tôi đồng ý cấp các quyền nêu trên cho kết nối này.</label>
            <button type="submit" name="decision" value="allow">Cho phép kết nối</button><button class="cancel" type="submit" name="decision" value="deny" formnovalidate>Hủy</button>
            </form></main></body></html>
            """, "text/html; charset=utf-8");
    }
}
