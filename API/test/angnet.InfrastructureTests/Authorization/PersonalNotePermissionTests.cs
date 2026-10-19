using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Services;
using angnet.WebApi.Authorization_Policy;
using angnet.WebApi.Controllers;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace angnet.InfrastructureTests.Authorization;

[TestClass, DoNotParallelize]
public class PersonalNotePermissionTests
{
    private static readonly SymmetricSecurityKey Key = new(Encoding.UTF8.GetBytes(
        "personal-note-authorization-test-only-key-2026-0123456789"));
    private const string Id = "ae7a323a-64b5-4b69-b2d8-7a713fcebb15";
    private WebApplication app = null!;
    private SqliteConnection connection = null!;
    private HttpClient http = null!;

    [TestInitialize]
    public async Task Start()
    {
        connection = new("Data Source=:memory:");
        await connection.OpenAsync();
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        builder.Logging.ClearProviders();
        builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite(connection));
        builder.Services.AddScoped<PersonalNoteService>();
        builder.Services.AddRateLimiter(o => o.AddConcurrencyLimiter("API", l => l.PermitLimit = 100));
        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o =>
            o.TokenValidationParameters = new() {
                ValidateIssuer = false, ValidateAudience = false, ValidateLifetime = true,
                IssuerSigningKey = Key, ClockSkew = TimeSpan.Zero
            });
        builder.Services.AddAuthorization();
        builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
        builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();
        builder.Services.AddControllers().AddApplicationPart(typeof(PersonalNotesController).Assembly);
        app = builder.Build();
        using (var scope = app.Services.CreateScope()) {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.EnsureCreatedAsync();
            db.Users.AddRange(new AppUser { Id = "owner", UserName = "owner", FullName = "Owner" },
                new AppUser { Id = "other", UserName = "other", FullName = "Other" });
            await db.SaveChangesAsync();
        }
        app.UseAuthentication(); app.UseAuthorization(); app.UseRateLimiter(); app.MapControllers();
        await app.StartAsync();
        http = new() { BaseAddress = new Uri(app.Urls.Single()) };
    }

    [TestCleanup]
    public async Task Stop()
    {
        http.Dispose();
        await app.DisposeAsync();
        await connection.DisposeAsync();
    }

    private static string Token(string permission = "personalnote.use", string owner = "owner", bool admin = false)
    {
        Claim[] claims = [new(ClaimTypes.NameIdentifier, owner), new(ClaimTypes.Role, admin ? "Admin" : "User"),
            new("permission", permission)];
        return new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(claims: claims,
            expires: DateTime.UtcNow.AddMinutes(5), signingCredentials: new(Key, SecurityAlgorithms.HmacSha256)));
    }

    private async Task<HttpStatusCode> Send(string method, string path, string? token, int version = 0)
    {
        using var request = new HttpRequestMessage(new HttpMethod(method), path);
        if (token != null) request.Headers.Authorization = new("Bearer", token);
        if (method is "PUT" or "POST") request.Content = JsonContent.Create(new {
            Title = "Private", ContentJson = "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\"}]}", Version = version
        });
        using var response = await http.SendAsync(request);
        return response.StatusCode;
    }

    [DataTestMethod]
    [DataRow("GET", "/api/PersonalNotes", 200)]
    [DataRow("GET", "/api/PersonalNotes/" + Id, 404)]
    [DataRow("PUT", "/api/PersonalNotes/" + Id, 200)]
    [DataRow("DELETE", "/api/PersonalNotes/" + Id + "?version=1", 404)]
    [DataRow("POST", "/api/PersonalNotes/" + Id + "/publish", 200)]
    [DataRow("DELETE", "/api/PersonalNotes/" + Id + "/publication?version=1", 404)]
    [DataRow("DELETE", "/api/PersonalNotes/" + Id + "/edit-link?version=1", 404)]
    public async Task EveryEndpoint_RequiresModuleKey(string method, string path, int allowed)
    {
        Assert.AreEqual(HttpStatusCode.Unauthorized, await Send(method, path, null));
        Assert.AreEqual(HttpStatusCode.Forbidden, await Send(method, path, Token("")));
        Assert.AreEqual(HttpStatusCode.Forbidden, await Send(method, path, Token("archive.use")));
        Assert.AreEqual((HttpStatusCode)allowed, await Send(method, path, Token()));
        Assert.AreEqual((HttpStatusCode)allowed, await Send(method, path, Token("", admin: true)));
    }

    [TestMethod]
    public async Task AuthorizedUsersAndAdmins_StillCannotAccessAnotherOwnersNotes()
    {
        var path = "/api/PersonalNotes/" + Id;
        Assert.AreEqual(HttpStatusCode.OK, await Send("PUT", path, Token()));
        foreach (bool admin in new[] { false, true }) {
            var token = Token(owner: "other", admin: admin);
            Assert.AreEqual(HttpStatusCode.NotFound, await Send("GET", path, token));
            Assert.AreEqual(HttpStatusCode.NotFound, await Send("PUT", path, token, version: 1));
            Assert.AreEqual(HttpStatusCode.NotFound, await Send("DELETE", path + "?version=1", token));
            Assert.AreEqual(HttpStatusCode.NotFound, await Send("POST", path + "/publish", token, version: 1));
            Assert.AreEqual(HttpStatusCode.NotFound, await Send("DELETE", path + "/publication?version=1", token));
            Assert.AreEqual(HttpStatusCode.NotFound, await Send("DELETE", path + "/edit-link?version=1", token));
        }
        Assert.AreEqual(HttpStatusCode.OK, await Send("GET", path, Token()));
    }

    [TestMethod]
    public async Task ImageNote_LargerThanOldTextLimit_CanBeSavedAndReopenedThroughHttp()
    {
        var image = new byte[600_000];
        new byte[] { 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a }.CopyTo(image, 0);
        string document = JsonSerializer.Serialize(new {
            type = "doc", content = new[] { new { type = "image", attrs = new { src = "data:image/png;base64," + Convert.ToBase64String(image) } } }
        });
        var path = "/api/PersonalNotes/" + Id;
        using var request = new HttpRequestMessage(HttpMethod.Put, path) {
            Content = JsonContent.Create(new { Title = "Screenshot", ContentJson = document, Version = 0 })
        };
        request.Headers.Authorization = new("Bearer", Token());
        using var response = await http.SendAsync(request);
        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode, await response.Content.ReadAsStringAsync());
        using var read = new HttpRequestMessage(HttpMethod.Get, path);
        read.Headers.Authorization = new("Bearer", Token());
        using var reopened = await http.SendAsync(read);
        Assert.AreEqual(HttpStatusCode.OK, reopened.StatusCode);
        using var body = JsonDocument.Parse(await reopened.Content.ReadAsStringAsync());
        Assert.AreEqual(document, body.RootElement.GetProperty("contentJson").GetString());
    }

    [TestMethod]
    public async Task PublicLink_IsAnonymousReadOnlyAndUncached_AndStopsWorkingAfterRevocation()
    {
        var path = "/api/PersonalNotes/" + Id;
        Assert.AreEqual(HttpStatusCode.OK, await Send("POST", path + "/publish", Token()));
        using var detailRequest = new HttpRequestMessage(HttpMethod.Get, path);
        detailRequest.Headers.Authorization = new("Bearer", Token());
        using var detail = await http.SendAsync(detailRequest);
        using var json = JsonDocument.Parse(await detail.Content.ReadAsStringAsync());
        string token = json.RootElement.GetProperty("publicToken").GetString()!;
        string publicPath = "/api/PublicPersonalNotes/" + token;
        using var response = await http.GetAsync(publicPath);
        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
        Assert.IsTrue(response.Headers.CacheControl!.NoStore);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        CollectionAssert.AreEquivalent(new[] { "title", "contentJson" }, body.RootElement.EnumerateObject().Select(p => p.Name).ToArray());
        Assert.AreEqual(HttpStatusCode.Unauthorized, await Send("GET", path, null));
        Assert.AreEqual(HttpStatusCode.NotFound, await Send("GET", "/api/PublicPersonalNotes/" + Id, null));
        using var write = await http.PostAsJsonAsync(publicPath, new { Title = "Changed" });
        Assert.AreEqual(HttpStatusCode.MethodNotAllowed, write.StatusCode);
        Assert.AreEqual(HttpStatusCode.OK, await Send("DELETE", path + "/publication?version=1", Token()));
        Assert.AreEqual(HttpStatusCode.NotFound, await Send("GET", publicPath, null));
    }

    [TestMethod]
    public async Task SharedEditor_UpdatesTheOriginalUsingAnEditKey_AndCannotManageSharing()
    {
        var path = "/api/PersonalNotes/" + Id;
        using var publish = new HttpRequestMessage(HttpMethod.Post, path + "/publish") {
            Content = JsonContent.Create(new { Title = "Shared", ContentJson = "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\"}]}", Version = 0, AllowEditing = true })
        };
        publish.Headers.Authorization = new("Bearer", Token());
        using var published = await http.SendAsync(publish);
        Assert.AreEqual(HttpStatusCode.OK, published.StatusCode);
        using var data = JsonDocument.Parse(await published.Content.ReadAsStringAsync());
        string edit = data.RootElement.GetProperty("editToken").GetString()!, view = data.RootElement.GetProperty("publicToken").GetString()!;
        var sharedPath = "/api/SharedPersonalNotes/" + edit;
        using var initial = await http.GetAsync(sharedPath);
        Assert.AreEqual(HttpStatusCode.OK, initial.StatusCode);
        Assert.IsTrue(initial.Headers.CacheControl!.NoStore);
        using var shared = JsonDocument.Parse(await initial.Content.ReadAsStringAsync());
        CollectionAssert.AreEquivalent(new[] { "title", "contentJson", "version" }, shared.RootElement.EnumerateObject().Select(p => p.Name).ToArray());
        int version = shared.RootElement.GetProperty("version").GetInt32();
        Assert.AreEqual(HttpStatusCode.OK, await Send("PUT", sharedPath, null, version));
        using var ownerRequest = new HttpRequestMessage(HttpMethod.Get, path);
        ownerRequest.Headers.Authorization = new("Bearer", Token());
        using var original = await http.SendAsync(ownerRequest);
        using var originalJson = JsonDocument.Parse(await original.Content.ReadAsStringAsync());
        Assert.AreEqual("Private", originalJson.RootElement.GetProperty("title").GetString());
        Assert.AreEqual(version + 1, originalJson.RootElement.GetProperty("version").GetInt32());
        Assert.AreEqual(HttpStatusCode.Conflict, await Send("PUT", sharedPath, null, version));
        Assert.AreEqual(HttpStatusCode.NotFound, await Send("PUT", "/api/SharedPersonalNotes/" + view, null, version));
        using var delete = await http.DeleteAsync(sharedPath);
        Assert.AreEqual(HttpStatusCode.MethodNotAllowed, delete.StatusCode);
        Assert.AreEqual(HttpStatusCode.Unauthorized, await Send("DELETE", path + "/edit-link?version=1", null));
        Assert.AreEqual(HttpStatusCode.Forbidden, await Send("DELETE", path + "/edit-link?version=1", Token("")));
        Assert.AreEqual(HttpStatusCode.Conflict, await Send("DELETE", path + "/edit-link?version=1", Token()));
        Assert.AreEqual(HttpStatusCode.OK, await Send("DELETE", path + "/edit-link?version=" + (version + 1), Token()));
        Assert.AreEqual(HttpStatusCode.NotFound, await Send("GET", sharedPath, null));
        Assert.AreEqual(HttpStatusCode.NotFound, await Send("PUT", sharedPath, null, version + 1));
        Assert.AreEqual(HttpStatusCode.OK, await Send("GET", "/api/PublicPersonalNotes/" + view, null));
    }
}
