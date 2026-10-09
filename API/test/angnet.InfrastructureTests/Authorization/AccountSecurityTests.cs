using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using angnet.Application.Interfaces.Repositories;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Repositories;
using angnet.Infrastructure.Data.Services;
using angnet.Infrastructure.Mail.Producer;
using angnet.Utility.CommonUtils;
using angnet.WebApi.Controllers;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Moq;

namespace angnet.InfrastructureTests.Authorization;

[TestClass]
[DoNotParallelize]
public class AccountSecurityTests
{
    private Fixture _f = null!;
    [TestInitialize] public async Task Start() => _f = await Fixture.Start();
    [TestCleanup] public async Task Stop() => await _f.DisposeAsync();

    [TestMethod]
    public async Task RevokeLockUnlock_RejectOldAccessAndRefreshAndRequireFreshLogin()
    {
        var login = await _f.Login();
        Assert.IsTrue(login.Success);
        var legacy = _f.Legacy(login.Data.AccessToken);
        Assert.AreEqual(HttpStatusCode.OK, await _f.Probe(legacy));
        Assert.IsTrue((await _f.Action("revoke-sessions")).Success);
        Assert.AreEqual(HttpStatusCode.Unauthorized, await _f.Probe(login.Data.AccessToken));
        Assert.AreEqual(HttpStatusCode.Unauthorized, await _f.Probe(legacy));
        Assert.IsFalse((await _f.Refresh(login.Data.RefreshToken)).Success);
        var second = await _f.Login();
        Assert.IsTrue(second.Success);
        Assert.IsTrue((await _f.Action("lock")).Success);
        Assert.AreEqual(HttpStatusCode.Unauthorized, await _f.Probe(second.Data.AccessToken));
        Assert.IsFalse((await _f.Login()).Success);
        Assert.IsFalse((await _f.Refresh(second.Data.RefreshToken)).Success);
        Assert.IsTrue((await _f.Action("unlock")).Success);
        Assert.AreEqual(HttpStatusCode.Unauthorized, await _f.Probe(second.Data.AccessToken));
        Assert.IsFalse((await _f.Refresh(second.Data.RefreshToken)).Success);
        var third = await _f.Login();
        Assert.IsTrue(third.Success);
        Assert.AreEqual(HttpStatusCode.OK, await _f.Probe(third.Data.AccessToken));
        Assert.AreEqual(3, (await _f.Db.Users.AsNoTracking().SingleAsync(x => x.Id == "target")).SessionVersion);
    }

    [DataTestMethod]
    [DataRow("revoke-sessions")]
    [DataRow("lock")]
    [DataRow("unlock")]
    public async Task SecurityEndpoints_OnlyAdminCanAct(string action)
    {
        var login = await _f.Login();
        using var anonymous = await _f.Send($"/api/Account/admin/users/target/{action}");
        Assert.AreEqual(HttpStatusCode.Unauthorized, anonymous.StatusCode);
        using var user = await _f.Send($"/api/Account/admin/users/target/{action}", login.Data.AccessToken);
        Assert.AreEqual(HttpStatusCode.Forbidden, user.StatusCode);
        Assert.AreEqual(0, (await _f.Db.Users.AsNoTracking().SingleAsync(x => x.Id == "target")).SessionVersion);
        Assert.IsFalse(await _f.Db.RefreshToken.AnyAsync(x => x.IsRevoked));
    }

    [TestMethod]
    public async Task CannotSelfLock_AndLegacyLogoutCannotTargetAnotherAccount()
    {
        var admin = await _f.AdminToken();
        using var selfLock = await _f.Send("/api/Account/admin/users/admin/lock", admin);
        Assert.IsFalse((await selfLock.Content.ReadFromJsonAsync<ApiResponse<UserDetailDto>>())!.Success);
        Assert.AreEqual(HttpStatusCode.OK, await _f.Probe(admin));
        var login = await _f.Login();
        using var other = await _f.Send("/api/Account/logoutalldevice?userId=admin", login.Data.AccessToken);
        Assert.AreEqual(HttpStatusCode.Forbidden, other.StatusCode);
        using var anonymous = await _f.Send("/api/Account/logoutalldevice?userId=target");
        Assert.AreEqual(HttpStatusCode.Unauthorized, anonymous.StatusCode);
        using var own = await _f.Send("/api/Account/logoutalldevice?userId=target", login.Data.AccessToken);
        Assert.AreEqual(HttpStatusCode.OK, own.StatusCode);
        Assert.AreEqual(HttpStatusCode.Unauthorized, await _f.Probe(login.Data.AccessToken));
    }

    [TestMethod]
    public async Task PasswordReset_DoesNotUnlockAnAdminLockedAccount()
    {
        Assert.IsTrue((await _f.Action("lock")).Success);
        using var reset = await _f.Send("/api/Account/admin/users/target/reset-password", await _f.AdminToken(),
            new { Password = "NewPassword456!" });
        var result = await reset.Content.ReadFromJsonAsync<ApiResponse<UserDetailDto>>();
        Assert.IsTrue(result!.Success, result.ErrorMessage);
        Assert.IsFalse(result.Data.FlagActive);
        Assert.IsFalse((await _f.Login("NewPassword456!")).Success);
        Assert.IsTrue((await _f.Action("unlock")).Success);
        Assert.IsTrue((await _f.Login("NewPassword456!")).Success);
        Assert.IsFalse((await _f.Login()).Success);
    }

    [TestMethod]
    public async Task AdminUnlock_ClearsTemporaryPasswordLockoutToo()
    {
        var user = (await _f.Users.FindByIdAsync("target"))!;
        Assert.IsTrue((await _f.Users.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddDays(1))).Succeeded);
        Assert.IsTrue((await _f.Action("lock")).Success);
        Assert.IsFalse((await _f.Login()).Success);
        Assert.IsTrue((await _f.Action("unlock")).Success);
        var actual = await _f.Db.Users.AsNoTracking().SingleAsync(x => x.Id == "target");
        Assert.IsNull(actual.LockoutEnd);
        Assert.AreEqual(0, actual.AccessFailedCount);
        Assert.IsTrue((await _f.Login()).Success);
    }

    [TestMethod]
    public async Task FailedAudit_RollsBackLockAndRevocation()
    {
        var login = await _f.Login();
        _f.Audit.Setup(a => a.Create(It.IsAny<AuditTrailDto>())).ReturnsAsync(new ApiResponse<AuditTrailDto>("Audit unavailable"));
        using var response = await _f.Send("/api/Account/admin/users/target/lock", await _f.AdminToken());
        Assert.AreEqual(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        var user = await _f.Db.Users.AsNoTracking().SingleAsync(x => x.Id == "target");
        Assert.IsTrue(user.FlagActive);
        Assert.AreEqual(0, user.SessionVersion);
        Assert.IsFalse(await _f.Db.RefreshToken.AnyAsync(x => x.IsRevoked));
        Assert.AreEqual(HttpStatusCode.OK, await _f.Probe(login.Data.AccessToken));
    }

    [TestMethod]
    public async Task Refresh_IsSingleUse_AndOrdinaryRequestsDoNotRevokeSessions()
    {
        var login = await _f.Login();
        Assert.AreEqual(HttpStatusCode.OK, await _f.Probe(login.Data.AccessToken));
        Assert.AreEqual(HttpStatusCode.OK, await _f.Probe(login.Data.AccessToken));
        var renewed = await _f.Refresh(login.Data.RefreshToken);
        Assert.IsTrue(renewed.Success, renewed.ErrorMessage);
        Assert.IsFalse((await _f.Refresh(login.Data.RefreshToken)).Success);
        Assert.AreEqual(HttpStatusCode.OK, await _f.Probe(renewed.Data.AccessToken));
        Assert.AreEqual("0", new JwtSecurityTokenHandler().ReadJwtToken(renewed.Data.AccessToken)
            .Claims.Single(c => c.Type == AccountSessionService.VersionClaim).Value);
    }

    [TestMethod]
    public async Task StaleIdentityWrite_CannotUndoAnAdminLock()
    {
        var stale = (await _f.Users.FindByIdAsync("target"))!;
        Assert.IsTrue((await _f.Action("lock")).Success);
        stale.FullName = "Concurrent profile update";
        var result = await _f.Users.UpdateAsync(stale);
        Assert.IsFalse(result.Succeeded);
        var actual = await _f.Db.Users.AsNoTracking().SingleAsync(x => x.Id == "target");
        Assert.IsFalse(actual.FlagActive);
        Assert.AreEqual(1, actual.SessionVersion);
    }

    [TestMethod]
    public async Task AvatarUpdate_OnlyChangesOwnPhoto_AndPreservesSessions()
    {
        var login = await _f.Login();
        const string url = "https://example.com/avatar.jpg?size=200";
        // The extra account ID is ignored: ownership always comes from the JWT.
        using var result = await _f.Send("/api/Account/avatar", login.Data.AccessToken,
            new { AvatarUrl = $" {url} ", UserId = "admin" }, HttpMethod.Put);
        Assert.AreEqual(HttpStatusCode.OK, result.StatusCode);
        var response = (await result.Content.ReadFromJsonAsync<ApiResponse<UserDetailDto>>())!;
        Assert.IsTrue(response.Success);
        Assert.AreEqual("target", response.Data.Id);
        Assert.AreEqual(url, response.Data.Avatar);
        Assert.AreEqual(url, (await _f.Db.Users.AsNoTracking().SingleAsync(x => x.Id == "target")).Avatar);
        Assert.AreEqual("", (await _f.Db.Users.AsNoTracking().SingleAsync(x => x.Id == "admin")).Avatar);
        Assert.AreEqual(HttpStatusCode.OK, await _f.Probe(login.Data.AccessToken));
        var refreshed = await _f.Refresh(login.Data.RefreshToken);
        Assert.IsTrue(refreshed.Success);
        Assert.AreEqual(url, new JwtSecurityTokenHandler().ReadJwtToken(refreshed.Data.AccessToken)
            .Claims.Single(c => c.Type == "avatar").Value);
        Assert.IsTrue((await _f.Action("lock")).Success);
        using var locked = await _f.Send("/api/Account/avatar", refreshed.Data.AccessToken,
            new { AvatarUrl = "https://example.com/other.jpg" }, HttpMethod.Put);
        Assert.AreEqual(HttpStatusCode.Unauthorized, locked.StatusCode);
        Assert.AreEqual(url, (await _f.Db.Users.AsNoTracking().SingleAsync(x => x.Id == "target")).Avatar);
    }

    [TestMethod]
    public async Task AvatarUpdate_RejectsAnonymousAndInvalidLinks()
    {
        using var anonymous = await _f.Send("/api/Account/avatar", body: new { AvatarUrl = "https://example.com/a.jpg" }, method: HttpMethod.Put);
        Assert.AreEqual(HttpStatusCode.Unauthorized, anonymous.StatusCode);
        var login = await _f.Login();
        foreach (var url in new[] { "", "   ", "/assets/photo.jpg", "http://example.com/a.jpg", "data:image/png;base64,abc", "javascript:alert(1)", "https://user:secret@example.com/a.jpg", "https://example.com/" + new string('a', 2048) })
        {
            using var response = await _f.Send("/api/Account/avatar", login.Data.AccessToken, new { AvatarUrl = url }, HttpMethod.Put);
            Assert.AreEqual(HttpStatusCode.BadRequest, response.StatusCode, url);
        }
        Assert.AreEqual("", (await _f.Db.Users.AsNoTracking().SingleAsync(x => x.Id == "target")).Avatar);
    }

    private sealed class Fixture : IAsyncDisposable
    {
        private const string Secret = "test-only-account-session-security-signing-key-2026-0123456789";
        private readonly SqliteConnection _connection = new("Data Source=:memory:");
        private WebApplication _app = null!;
        private IServiceScope _scope = null!;
        private HttpClient _client = null!;
        public Mock<IAuditTrailService> Audit { get; } = new();
        public AppDbContext Db => _scope.ServiceProvider.GetRequiredService<AppDbContext>();
        public UserManager<AppUser> Users => _scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        public static async Task<Fixture> Start()
        {
            var f = new Fixture();
            await f._connection.OpenAsync();
            var builder = WebApplication.CreateBuilder();
            builder.WebHost.UseUrls("http://127.0.0.1:0");
            builder.Logging.ClearProviders();
            foreach (var pair in new Dictionary<string, string> {
                ["JWTSetting:securityKey"] = Secret, ["JWTSetting:validAudience"] = "security-tests",
                ["JWTSetting:validIssuer"] = "security-tests", ["JWTSetting:accessTokenExpired"] = "1",
                ["JWTSetting:refreshTokenExpired"] = "7", ["AspIdentity:MaxFailedAccessAttempts"] = "5"
            }) builder.Configuration[pair.Key] = pair.Value;
            builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite(f._connection));
            builder.Services.AddDataProtection();
            builder.Services.AddIdentityCore<AppUser>().AddRoles<IdentityRole>()
                .AddEntityFrameworkStores<AppDbContext>().AddDefaultTokenProviders();
            builder.Services.AddHttpContextAccessor();
            builder.Services.AddScoped<WriteLog>();
            builder.Services.AddSingleton<RabbitMqEmailProducer>();
            f.Audit.Setup(a => a.Create(It.IsAny<AuditTrailDto>())).ReturnsAsync(new ApiResponse<AuditTrailDto>());
            builder.Services.AddSingleton(f.Audit.Object);
            builder.Services.AddScoped<IAccountRespository, AccountRespository>();
            builder.Services.AddScoped<IAdminAccountService, AdminAccountService>();
            builder.Services.AddScoped<AccountSessionService>();
            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o => {
                o.TokenValidationParameters = new TokenValidationParameters {
                    ValidateIssuer = true, ValidIssuer = "security-tests", ValidateAudience = true,
                    ValidAudience = "security-tests", ValidateLifetime = true, ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Secret)), ClockSkew = TimeSpan.Zero
                };
                o.Events = new JwtBearerEvents { OnTokenValidated = async c => {
                    if (c.Principal is null || !await c.HttpContext.RequestServices.GetRequiredService<AccountSessionService>().IsCurrent(c.Principal)) c.Fail("Session revoked");
                }};
            });
            builder.Services.AddAuthorization();
            builder.Services.AddControllers(o => o.Filters.Add(new AuthorizeFilter(
                new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build())))
                .AddApplicationPart(typeof(AdminAccountsController).Assembly);
            f._app = builder.Build();
            f._scope = f._app.Services.CreateScope();
            await f.Db.Database.EnsureCreatedAsync();
            var roles = f._scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            foreach (var role in new[] { "Admin", "User" }) Assert.IsTrue((await roles.CreateAsync(new IdentityRole(role))).Succeeded);
            foreach (var id in new[] { "admin", "target" }) {
                var user = new AppUser { Id = id, UserName = id, FullName = id, FlagActive = true, LockoutEnabled = true };
                Assert.IsTrue((await f.Users.CreateAsync(user, "Password123!")).Succeeded);
                Assert.IsTrue((await f.Users.AddToRoleAsync(user, id == "admin" ? "Admin" : "User")).Succeeded);
            }
            f._app.UseAuthentication(); f._app.UseAuthorization(); f._app.MapControllers();
            f._app.MapGet("/protected-probe", () => "ok").RequireAuthorization();
            await f._app.StartAsync();
            f._client = new HttpClient { BaseAddress = new Uri(f._app.Urls.Single()) };
            return f;
        }

        public async Task<string> AdminToken()
        {
            using var scope = _app.Services.CreateScope();
            var user = (await scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>().FindByIdAsync("admin"))!;
            return ((AccountRespository)scope.ServiceProvider.GetRequiredService<IAccountRespository>()).GenerateAccessToken(user);
        }
        public async Task<ApiResponse<AuthResponseDto>> Login(string password = "Password123!") {
            using var r = await Send("/api/Account/login", body: new { Email = "target", Password = password });
            return (await r.Content.ReadFromJsonAsync<ApiResponse<AuthResponseDto>>())!;
        }
        public async Task<ApiResponse<AuthResponseDto>> Refresh(string token) {
            using var r = await Send("/api/Account/refreshtoken", body: new { UserId = "target", RefreshToken = token });
            return (await r.Content.ReadFromJsonAsync<ApiResponse<AuthResponseDto>>())!;
        }
        public async Task<ApiResponse<UserDetailDto>> Action(string action) {
            using var r = await Send($"/api/Account/admin/users/target/{action}", await AdminToken());
            return (await r.Content.ReadFromJsonAsync<ApiResponse<UserDetailDto>>())!;
        }
        public async Task<HttpStatusCode> Probe(string token) {
            using var request = new HttpRequestMessage(HttpMethod.Get, "/protected-probe");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            using var response = await _client.SendAsync(request); return response.StatusCode;
        }
        public Task<HttpResponseMessage> Send(string path, string? token = null, object? body = null, HttpMethod? method = null) {
            var request = new HttpRequestMessage(method ?? HttpMethod.Post, path) { Content = JsonContent.Create(body ?? new {}) };
            if (token is not null) request.Headers.Authorization = new("Bearer", token);
            return _client.SendAsync(request);
        }
        public string Legacy(string value) {
            var t = new JwtSecurityTokenHandler().ReadJwtToken(value);
            return new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken("security-tests", "security-tests",
                t.Claims.Where(c => c.Type != AccountSessionService.VersionClaim && c.Type is not "aud" and not "iss" and not "exp" and not "nbf" and not "iat"),
                DateTime.UtcNow.AddMinutes(-1), DateTime.UtcNow.AddMinutes(5),
                new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Secret)), SecurityAlgorithms.HmacSha256)));
        }
        public async ValueTask DisposeAsync() {
            _client?.Dispose(); _scope?.Dispose();
            if (_app is not null) await _app.DisposeAsync(); await _connection.DisposeAsync();
        }
    }
}
