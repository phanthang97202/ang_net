using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
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
        if (method == "PUT") request.Content = JsonContent.Create(new {
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
        }
        Assert.AreEqual(HttpStatusCode.OK, await Send("GET", path, Token()));
    }
}
