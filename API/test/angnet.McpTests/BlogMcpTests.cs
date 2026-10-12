using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using angnet.Application.Interfaces.Repositories;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.Domain.Enums;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Repositories;
using angnet.Infrastructure.Data.Services;
using angnet.WebApi.Controllers;
using angnet.WebApi.Mcp;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Moq;
using StackExchange.Redis;

namespace angnet.McpTests;

[TestClass, DoNotParallelize]
public class BlogMcpTests
{
    private WebApplication app = null!;
    private SqliteConnection connection = null!;
    private HttpClient http = null!;
    private const string Password = "Test-only-Password!123";
    private const string Callback = "https://chatgpt.com/connector_platform_oauth_redirect";
    private const string Verifier = "test-verifier-0123456789-abcdefghijklmnopqrstuvwxyz-0123456789";
    private const string Resource = "https://blog.test/mcp";
    private readonly Mock<INewsRespository> news = new();
    private readonly Mock<INewsCategoryService> categories = new();
    private string userId = "";
    private string cookie = "";
    private bool useRealRepository;

    [TestInitialize]
    public async Task Start()
    {
        connection = new("Data Source=:memory:");
        await connection.OpenAsync();
        var b = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Development" });
        b.WebHost.UseTestServer();
        b.Logging.ClearProviders();
        b.Configuration["Mcp:Enabled"] = "true";
        b.Configuration["Mcp:Issuer"] = "https://blog.test/";
        // Test-only keys exist exclusively in memory.
        using var rsa = RSA.Create(2048);
        b.Configuration["Mcp:SigningKey"] = Convert.ToBase64String(rsa.ExportRSAPrivateKey());
        b.Configuration["Mcp:EncryptionKey"] = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        b.Services.AddDbContext<AppDbContext>(o => o.UseSqlite(connection));
        b.Services.AddIdentity<AppUser, IdentityRole>().AddEntityFrameworkStores<AppDbContext>().AddDefaultTokenProviders();
        b.Services.AddAuthentication(o => { o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            o.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme; }).AddJwtBearer(o =>
        {
            o.TokenValidationParameters = new() { ValidateIssuer = false, ValidateAudience = false,
                IssuerSigningKey = new SymmetricSecurityKey(RandomNumberGenerator.GetBytes(32)) };
        });
        b.Services.AddHttpContextAccessor();
        b.Services.AddRateLimiter(o => o.AddConcurrencyLimiter("API", x => { x.PermitLimit = 100; x.QueueLimit = 0; }));
        b.Services.AddControllers().AddApplicationPart(typeof(BlogMcpOAuthController).Assembly);
        categories.Setup(x => x.GetAllActive()).ReturnsAsync(new ApiResponse<NewsCategoryDto>());
        b.Services.AddSingleton(categories.Object);
        var redis = new Mock<IConnectionMultiplexer>();
        var cache = new Mock<IDatabase>();
        redis.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>())).Returns(cache.Object);
        b.Services.AddSingleton(redis.Object);
        b.Services.AddScoped<INewsRespository>(sp => useRealRepository
            ? ActivatorUtilities.CreateInstance<NewsRespository>(sp) : news.Object);
        var settings = b.AddBlogMcp();
        app = b.Build();
        app.UseDeveloperExceptionPage();
        app.UseRouting(); app.UseRateLimiter(); app.UseBlogMcp(settings); app.UseAuthentication(); app.UseAuthorization();
        app.MapControllers(); app.MapBlogMcp(settings);
        app.MapGet("/test/rest-admin", () => Results.Ok()).RequireAuthorization();
        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.EnsureCreatedAsync();
            var users = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
            var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            await roles.CreateAsync(new IdentityRole("Admin"));
            var user = new AppUser { UserName = "mcp-test", FlagActive = true, FullName = "MCP Test", SecurityStamp = Guid.NewGuid().ToString() };
            Assert.IsTrue((await users.CreateAsync(user, Password)).Succeeded);
            await users.AddToRoleAsync(user, "Admin"); userId = user.Id;
            await users.CreateAsync(new AppUser { Id = "other", UserName = "other", FlagActive = true });
            db.NewsCategory.Add(new NewsCategoryModel { NewsCategoryId = "music", NewsCategoryName = "Music", FlagActive = true });
            db.News.Add(new NewsModel { NewsId = "public", CategoryNewsId = "music", UserId = userId, ShortTitle = "Public", FlagActive = true });
            db.News.Add(new NewsModel { NewsId = "my-draft", CategoryNewsId = "music", UserId = userId, ShortTitle = "My draft", FlagActive = false });
            db.News.Add(new NewsModel { NewsId = "private-other", CategoryNewsId = "music", UserId = "other", ShortTitle = "Secret", FlagActive = true, WhoCanSee = EWhoCanSee.Private });
            await db.SaveChangesAsync();
        }
        await app.InitializeBlogMcp(settings);
        await app.StartAsync(); http = app.GetTestClient(); http.BaseAddress = new Uri("https://blog.test");
    }

    [TestCleanup]
    public async Task Stop() { http?.Dispose(); if (app is not null) await app.DisposeAsync(); if (connection is not null) await connection.DisposeAsync(); }

    private string AuthorizeUrl(string scopes = "blog.read blog.write blog.publish offline_access", string callback = Callback,
        string resource = Resource, string method = "S256") => "/oauth/authorize?" + string.Join("&", new Dictionary<string, string>
        {
            ["client_id"] = BlogMcpOptions.ClientId, ["response_type"] = "code", ["redirect_uri"] = callback,
            ["scope"] = scopes, ["resource"] = resource, ["state"] = "test-state",
            ["code_challenge"] = Base64UrlEncoder.Encode(SHA256.HashData(Encoding.ASCII.GetBytes(Verifier))),
            ["code_challenge_method"] = method
        }.Select(x => Uri.EscapeDataString(x.Key) + "=" + Uri.EscapeDataString(x.Value)));

    private async Task<string> Code(string scopes = "blog.read blog.write blog.publish offline_access")
    {
        var url = AuthorizeUrl(scopes);
        var form = await http.GetAsync(url);
        var html = await form.Content.ReadAsStringAsync();
        Assert.AreEqual(HttpStatusCode.OK, form.StatusCode, html);
        cookie = form.Headers.GetValues("Set-Cookie").First().Split(';')[0];
        var csrf = WebUtility.HtmlDecode(Regex.Match(html, "name=\"__RequestVerificationToken\" value=\"([^\"]+)\"").Groups[1].Value);
        using var request = new HttpRequestMessage(HttpMethod.Post, "/oauth/authorize");
        request.Headers.Add("Cookie", cookie);
        var fields = Regex.Matches(html, "<input type=\"hidden\" name=\"([^\"]+)\" value=\"([^\"]*)\">")
            .ToDictionary(x => WebUtility.HtmlDecode(x.Groups[1].Value), x => WebUtility.HtmlDecode(x.Groups[2].Value));
        fields["username"] = "mcp-test"; fields["password"] = Password; fields["consent"] = "true";
        fields["__RequestVerificationToken"] = csrf;
        request.Content = new FormUrlEncodedContent(fields);
        var response = await http.SendAsync(request);
        Assert.AreEqual(HttpStatusCode.Redirect, response.StatusCode, await response.Content.ReadAsStringAsync());
        var query = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(response.Headers.Location!.Query);
        Assert.AreEqual("test-state", query["state"].ToString());
        Assert.AreEqual("https://blog.test/", query["iss"].ToString());
        Assert.IsTrue(query.ContainsKey("code"), response.Headers.Location.ToString());
        return query["code"].ToString();
    }

    private Task<HttpResponseMessage> Exchange(string code, string verifier = Verifier, string resource = Resource) =>
        http.PostAsync("/oauth/token", new FormUrlEncodedContent(new Dictionary<string, string> {
            ["grant_type"] = "authorization_code", ["client_id"] = BlogMcpOptions.ClientId,
            ["code"] = code, ["redirect_uri"] = Callback, ["code_verifier"] = verifier, ["resource"] = resource }));

    private async Task<JsonElement> Tokens(string scopes = "blog.read blog.write blog.publish offline_access")
    {
        var response = await Exchange(await Code(scopes)); var body = await response.Content.ReadAsStringAsync();
        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode, body);
        return JsonDocument.Parse(body).RootElement.Clone();
    }

    private async Task<HttpResponseMessage> Rpc(string token, object payload, string? origin = null)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/mcp");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Headers.Accept.ParseAdd("application/json, text/event-stream");
        request.Headers.Add("MCP-Protocol-Version", "2025-06-18");
        if (origin is not null) request.Headers.Add("Origin", origin);
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        return await http.SendAsync(request);
    }

    private async Task<string> Tool(string token, string name, object args)
    {
        var response = await Rpc(token, new { jsonrpc = "2.0", id = 1, method = "tools/call", @params = new { name, arguments = args } });
        var body = await response.Content.ReadAsStringAsync(); Assert.AreEqual(HttpStatusCode.OK, response.StatusCode, body); return body;
    }

    [TestMethod] public async Task Consent_Form_CSP_Permits_ChatGPT_Callback_Without_Allowing_Arbitrary_Origins()
    {
        var response = await http.GetAsync(AuthorizeUrl());
        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
        var csp = response.Headers.GetValues("Content-Security-Policy").Single();
        var directives = csp.Split(';', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        Assert.AreEqual("form-action 'self' https://chatgpt.com",
            directives.Single(d => d.StartsWith("form-action ", StringComparison.Ordinal)));
        CollectionAssert.Contains(directives, "default-src 'none'");
        CollectionAssert.Contains(directives, "base-uri 'none'");
        CollectionAssert.Contains(directives, "frame-ancestors 'none'");
        Assert.AreEqual("/oauth/authorize", Regex.Match(await response.Content.ReadAsStringAsync(),
            "<form[^>]*action=\"([^\"]*)\"").Groups[1].Value);
    }

    [TestMethod] public async Task Discovery_And_Unauthenticated_Challenge()
    {
        var discovery = await http.GetStringAsync("/.well-known/oauth-authorization-server");
        StringAssert.Contains(discovery, "S256"); StringAssert.Contains(discovery, "authorization_response_iss_parameter_supported");
        var metadataResponse = await http.GetAsync("/.well-known/oauth-protected-resource/mcp");
        var metadata = await metadataResponse.Content.ReadAsStringAsync();
        Assert.AreEqual(HttpStatusCode.OK, metadataResponse.StatusCode, metadata); StringAssert.Contains(metadata, Resource);
        var response = await http.PostAsync("/mcp", new StringContent("{}", Encoding.UTF8, "application/json"));
        Assert.AreEqual(HttpStatusCode.Unauthorized, response.StatusCode);
        StringAssert.Contains(response.Headers.WwwAuthenticate.ToString(), "resource_metadata");
    }

    [TestMethod] public async Task OAuth_MCP_Tools_Work_And_OAuth_Cannot_Call_REST()
    {
        var tokens = await Tokens(); var token = tokens.GetProperty("access_token").GetString()!;
        Assert.IsFalse(token.Contains('.')); Assert.IsTrue(tokens.TryGetProperty("refresh_token", out _));
        var response = await Rpc(token, new { jsonrpc = "2.0", id = 1, method = "tools/list" });
        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync(); StringAssert.Contains(body, "create_post"); StringAssert.Contains(body, "publish_post");
        using var rest = new HttpRequestMessage(HttpMethod.Get, "/test/rest-admin"); rest.Headers.Authorization = new("Bearer", token);
        Assert.AreEqual(HttpStatusCode.Unauthorized, (await http.SendAsync(rest)).StatusCode);
    }

    [TestMethod] public async Task Wrong_PKCE_Resource_And_Replayed_Code_Are_Rejected()
    {
        var code = await Code(); Assert.AreEqual(HttpStatusCode.BadRequest, (await Exchange(code, "wrong-verifier")).StatusCode);
        Assert.AreEqual(HttpStatusCode.BadRequest, (await Exchange(await Code(), resource: "https://other.test/mcp")).StatusCode);
        code = await Code(); Assert.AreEqual(HttpStatusCode.OK, (await Exchange(code)).StatusCode);
        Assert.AreEqual(HttpStatusCode.BadRequest, (await Exchange(code)).StatusCode);
    }

    [TestMethod] public async Task Untrusted_Callback_Missing_PKCE_And_Missing_CSRF_Are_Rejected()
    {
        Assert.AreEqual(HttpStatusCode.BadRequest, (await http.GetAsync(AuthorizeUrl(callback: "https://evil.test/callback"))).StatusCode);
        Assert.AreEqual(HttpStatusCode.BadRequest, (await http.GetAsync(AuthorizeUrl(method: "plain"))).StatusCode);
        var noPkce = Regex.Replace(AuthorizeUrl(), "&code_challenge=[^&]+&code_challenge_method=[^&]+", "");
        Assert.AreEqual(HttpStatusCode.BadRequest, (await http.GetAsync(noPkce)).StatusCode);
        var fields = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(new Uri(http.BaseAddress!, AuthorizeUrl()).Query)
            .ToDictionary(x => x.Key, x => x.Value.ToString());
        fields["username"] = "mcp-test"; fields["password"] = Password; fields["consent"] = "true";
        var csrfResponse = await http.PostAsync("/oauth/authorize", new FormUrlEncodedContent(fields));
        Assert.AreEqual(HttpStatusCode.BadRequest, csrfResponse.StatusCode);
        StringAssert.Contains(await csrfResponse.Content.ReadAsStringAsync(), "Invalid authorization form");
    }

    [TestMethod] public async Task Explicit_Consent_Is_Required_And_User_Can_Cancel()
    {
        var form = await http.GetAsync(AuthorizeUrl()); var html = await form.Content.ReadAsStringAsync();
        var fields = Regex.Matches(html, "<input type=\"hidden\" name=\"([^\"]+)\" value=\"([^\"]*)\">")
            .ToDictionary(x => WebUtility.HtmlDecode(x.Groups[1].Value), x => WebUtility.HtmlDecode(x.Groups[2].Value));
        async Task<HttpResponseMessage> Submit()
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "/oauth/authorize");
            request.Headers.Add("Cookie", form.Headers.GetValues("Set-Cookie").First().Split(';')[0]);
            request.Content = new FormUrlEncodedContent(fields); return await http.SendAsync(request);
        }
        fields["username"] = "mcp-test"; fields["password"] = Password;
        var response = await Submit(); Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
        Assert.IsNull(response.Headers.Location); StringAssert.Contains(await response.Content.ReadAsStringAsync(), "name=\"client_id\"");
        fields["decision"] = "deny";
        response = await Submit(); Assert.AreEqual(HttpStatusCode.Redirect, response.StatusCode);
        StringAssert.Contains(response.Headers.Location!.Query, "error=access_denied");
        Assert.IsFalse(response.Headers.Location.Query.Contains("code="));
    }

    [TestMethod] public async Task Session_Revocation_Rejects_Access_And_Refresh()
    {
        var tokens = await Tokens();
        using (var scope = app.Services.CreateScope()) await AccountSessionService.RevokeAll(scope.ServiceProvider.GetRequiredService<AppDbContext>(), userId);
        var response = await Rpc(tokens.GetProperty("access_token").GetString()!, new { jsonrpc = "2.0", id = 1, method = "tools/list" });
        Assert.AreEqual(HttpStatusCode.Forbidden, response.StatusCode);
        response = await http.PostAsync("/oauth/token", new FormUrlEncodedContent(new Dictionary<string, string> {
            ["grant_type"] = "refresh_token", ["client_id"] = BlogMcpOptions.ClientId, ["resource"] = Resource,
            ["refresh_token"] = tokens.GetProperty("refresh_token").GetString()! }));
        Assert.AreEqual(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [TestMethod] public async Task Other_Private_Posts_And_Untrusted_Origins_Are_Blocked()
    {
        var token = (await Tokens()).GetProperty("access_token").GetString()!;
        var search = await Tool(token, "search_posts", new { keyword = "Secret", includeMyDrafts = true });
        Assert.IsFalse(search.Contains("private-other"), search);
        var secret = await Tool(token, "get_post", new { newsId = "private-other" }); StringAssert.Contains(secret, "access denied");
        var own = await Tool(token, "get_post", new { newsId = "my-draft" }); StringAssert.Contains(own, "My draft");
        var publish = await Tool(token, "publish_post", new { newsId = "private-other" }); StringAssert.Contains(publish, "not owned");
        news.Verify(x => x.Update(It.IsAny<ClaimsPrincipal>(), It.IsAny<UpdateNewsDto>()), Times.Never);
        var response = await Rpc(token, new { jsonrpc = "2.0", id = 1, method = "tools/list" }, "https://evil.test");
        Assert.AreEqual(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [TestMethod] public async Task Read_Only_Scope_Cannot_Create_Post()
    {
        var token = (await Tokens("blog.read")).GetProperty("access_token").GetString()!;
        var body = await Tool(token, "create_post", new { post = new NewsDto { ShortTitle = "New" } });
        StringAssert.Contains(body, "Access denied");
        news.Verify(x => x.Create(It.IsAny<ClaimsPrincipal>(), It.IsAny<NewsDto>()), Times.Never);
    }

    [TestMethod] public async Task Draft_Default_Sanitization_Duplicate_Check_And_Publication_Persist()
    {
        useRealRepository = true;
        var token = (await Tokens()).GetProperty("access_token").GetString()!;
        var post = new NewsDto { CategoryNewsId = "music", ShortTitle = "MCP New Post",
            ShortDescription = "A description", ContentBody = "<h2>Useful content</h2><p>Body</p><script>alert(1)</script><img src=\"https://example.com/photo.jpg\" alt=\"Photo\" onerror=\"alert(1)\">",
            ShortTitleEn = "MCP English Post", ShortDescriptionEn = "English description", ContentBodyEn = "<p>English body</p>",
            FlagActive = true, WhoCanSee = EWhoCanSee.Public,
            LstHashTagNews = [new() { HashTagNewsName = "Âm nhạc" }], LstHashTagNewsEn = [new() { HashTagNewsName = "Music" }] };
        var result = await Tool(token, "create_post", new { post });
        Assert.IsFalse(result.Contains("\"isError\":true"), result);
        using var scope = app.Services.CreateScope(); var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var saved = await db.News.AsNoTracking().SingleAsync(n => n.ShortTitle == post.ShortTitle);
        Assert.AreEqual(userId, saved.UserId); Assert.IsFalse(saved.FlagActive); Assert.AreEqual(EWhoCanSee.Private, saved.WhoCanSee);
        Assert.IsFalse(saved.ContentBody.Contains("<script") || saved.ContentBody.Contains("onerror"));
        StringAssert.Contains(saved.ContentBody, "alt="); Assert.AreEqual(post.ContentBodyEn, saved.ContentBodyEn);
        result = await Tool(token, "create_post", new { post }); StringAssert.Contains(result, "already exists");
        Assert.AreEqual(1, await db.News.CountAsync(n => n.ShortTitle == post.ShortTitle));
        result = await Tool(token, "publish_post", new { newsId = saved.NewsId });
        Assert.IsFalse(result.Contains("\"isError\":true"), result);
        saved = await db.News.AsNoTracking().SingleAsync(n => n.NewsId == saved.NewsId);
        Assert.IsTrue(saved.FlagActive); Assert.AreEqual(EWhoCanSee.Public, saved.WhoCanSee);
        Assert.AreEqual(2, await db.HashTagNews.CountAsync(t => t.NewsId == saved.NewsId));
        var again = await Tool(token, "publish_post", new { newsId = saved.NewsId }); StringAssert.Contains(again, "alreadyPublished");
    }

    [TestMethod] public async Task Missing_Publish_Scope_Cannot_Make_A_Post_Public()
    {
        var token = (await Tokens("blog.read blog.write")).GetProperty("access_token").GetString()!;
        var result = await Tool(token, "create_post", new { post = new NewsDto { ShortTitle = "Blocked" }, publish = true });
        StringAssert.Contains(result, "Access denied");
        result = await Tool(token, "publish_post", new { newsId = "my-draft" }); StringAssert.Contains(result, "Access denied");
        news.Verify(x => x.Create(It.IsAny<ClaimsPrincipal>(), It.IsAny<NewsDto>()), Times.Never);
        news.Verify(x => x.Update(It.IsAny<ClaimsPrincipal>(), It.IsAny<UpdateNewsDto>()), Times.Never);
    }

    [TestMethod] public async Task Revoked_Connect_Permission_Rejects_An_Existing_Token()
    {
        var token = (await Tokens()).GetProperty("access_token").GetString()!;
        using (var scope = app.Services.CreateScope())
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
            await users.RemoveFromRoleAsync((await users.FindByIdAsync(userId))!, "Admin");
        }
        var result = await Rpc(token, new { jsonrpc = "2.0", id = 1, method = "tools/list" });
        Assert.AreEqual(HttpStatusCode.Forbidden, result.StatusCode);
    }

    [TestMethod] public async Task Disabled_MCP_And_OAuth_Return_404_Without_Changing_REST_Authentication()
    {
        var b = WebApplication.CreateBuilder(); b.WebHost.UseTestServer(); b.Logging.ClearProviders();
        b.Services.AddDbContext<AppDbContext>(o => o.UseSqlite(connection));
        b.Services.AddIdentity<AppUser, IdentityRole>().AddEntityFrameworkStores<AppDbContext>();
        b.Services.AddControllers().AddApplicationPart(typeof(BlogMcpOAuthController).Assembly);
        b.Services.AddRateLimiter(o => o.AddConcurrencyLimiter("API", x => { x.PermitLimit = 10; x.QueueLimit = 0; }));
        var disabled = b.AddBlogMcp(); Assert.IsFalse(disabled.Enabled);
        await using var host = b.Build(); host.UseRouting(); host.UseRateLimiter(); host.UseAuthentication(); host.UseAuthorization();
        host.MapControllers(); host.MapBlogMcp(disabled); await host.StartAsync();
        using var client = host.GetTestClient();
        Assert.AreEqual(HttpStatusCode.NotFound, (await client.GetAsync("/oauth/authorize")).StatusCode);
        Assert.AreEqual(HttpStatusCode.NotFound, (await client.PostAsync("/oauth/token", new StringContent(""))).StatusCode);
        Assert.AreEqual(HttpStatusCode.NotFound, (await client.GetAsync("/mcp")).StatusCode);
    }

    [TestMethod] public async Task Refresh_Token_Rotates_And_Revocation_Endpoint_Rejects_Access()
    {
        var tokens = await Tokens(); var oldRefresh = tokens.GetProperty("refresh_token").GetString()!;
        var response = await http.PostAsync("/oauth/token", new FormUrlEncodedContent(new Dictionary<string, string> {
            ["grant_type"] = "refresh_token", ["client_id"] = BlogMcpOptions.ClientId, ["resource"] = Resource, ["refresh_token"] = oldRefresh }));
        var body = await response.Content.ReadAsStringAsync(); Assert.AreEqual(HttpStatusCode.OK, response.StatusCode, body);
        var renewed = JsonDocument.Parse(body).RootElement;
        Assert.AreNotEqual(oldRefresh, renewed.GetProperty("refresh_token").GetString());
        var token = renewed.GetProperty("access_token").GetString()!;
        response = await http.PostAsync("/oauth/revoke", new FormUrlEncodedContent(new Dictionary<string, string> {
            ["client_id"] = BlogMcpOptions.ClientId, ["token"] = token, ["token_type_hint"] = "access_token" }));
        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode, await response.Content.ReadAsStringAsync());
        response = await Rpc(token, new { jsonrpc = "2.0", id = 1, method = "tools/list" });
        Assert.AreEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [TestMethod] public void Production_Requires_Persistent_Secrets_And_Exact_Callback()
    {
        Assert.ThrowsException<InvalidOperationException>(() => BlogMcpConfiguration.Validate(new(), false));
        Assert.ThrowsException<InvalidOperationException>(() => BlogMcpConfiguration.Validate(new() { RedirectUris = ["https://chatgpt.com/*"] }, true));
        Assert.ThrowsException<InvalidOperationException>(() => BlogMcpConfiguration.Validate(new() { Issuer = "http://blog.test/" }, true));
    }

    [TestMethod] public void OAuth_Migration_Matches_PostgreSQL_Model()
    {
        using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseNpgsql("Host=unused;Database=unused").Options);
        var sql = db.Database.GenerateCreateScript();
        var statements = sql.Split(";", StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Where(s => s.StartsWith("CREATE TABLE \"OpenIddict", StringComparison.Ordinal)
                || s.StartsWith("CREATE INDEX \"IX_OpenIddict", StringComparison.Ordinal)
                || s.StartsWith("CREATE UNIQUE INDEX \"IX_OpenIddict", StringComparison.Ordinal)).ToArray();
        Assert.AreEqual(4, statements.Count(s => s.StartsWith("CREATE TABLE", StringComparison.Ordinal)));
        using var stream = typeof(AppDbContext).Assembly.GetManifestResourceStream(
            "angnet.Infrastructure.Data.Persistences.Scripts.0050_TaoBangBlogMcpOAuth.sql")!;
        using var reader = new StreamReader(stream);
        var migration = Regex.Replace(reader.ReadToEnd(), "--[^\r\n]*", "");
        var compact = Regex.Replace(migration, "\\s+", " ");
        foreach (var statement in statements) StringAssert.Contains(compact, Regex.Replace(statement, "\\s+", " "));
    }
}
