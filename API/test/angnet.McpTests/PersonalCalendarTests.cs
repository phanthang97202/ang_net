using System.Security.Claims;
using System.Text.Json;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.WebApi.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Http.Json;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using angnet.WebApi.Authorization_Policy;

[TestClass]
public class PersonalCalendarTests
{
    [TestMethod]
    public async Task OwnerIsolationOverlapValidationAndVersionConflicts()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        db.Users.AddRange(new AppUser { Id = "alice", UserName = "alice" }, new AppUser { Id = "bob", UserName = "bob" });
        await db.SaveChangesAsync();
        var controller = new PersonalCalendarController(db, TimeProvider.System) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        void User(string id) => controller.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, id)], "test"));
        User("alice");
        var input = new PersonalCalendarEventRequest { Title = "Đi chơi", StartDate = "2026-10-30", EndDate = "2026-11-02", StartTime = "09:00", EndTime = "10:00", Category = "leisure" };
        var result = (OkObjectResult)await controller.Create(input, default);
        var json = JsonSerializer.SerializeToElement(result.Value);
        var id = json.GetProperty("EventId").GetString()!;
        Assert.AreEqual(1, json.GetProperty("Version").GetInt32());
        var listed = (OkObjectResult)await controller.List("2026-11-01", "2026-11-30", default);
        Assert.AreEqual(1, JsonSerializer.SerializeToElement(listed.Value).GetArrayLength());
        Assert.IsInstanceOfType(await controller.List("2026-11-01", "2027-03-01", default), typeof(BadRequestObjectResult));
        User("bob");
        Assert.AreEqual(0, JsonSerializer.SerializeToElement(((OkObjectResult)await controller.List("2026-11-01", "2026-11-30", default)).Value).GetArrayLength());
        input.Version = 1;
        Assert.IsInstanceOfType(await controller.Update(id, input, default), typeof(NotFoundResult));
        Assert.IsInstanceOfType(await controller.Delete(id, 1, default), typeof(NotFoundResult));
        User("alice");
        input.Title = "Cập nhật";
        Assert.IsInstanceOfType(await controller.Update(id, input, default), typeof(OkObjectResult));
        Assert.IsInstanceOfType(await controller.Delete(id, 1, default), typeof(ConflictObjectResult));
        Assert.IsInstanceOfType(await controller.Update(id, input, default), typeof(ConflictObjectResult));
        Assert.IsInstanceOfType(await controller.Delete(id, 2, default), typeof(NoContentResult));
        input.StartDate = "2026-11-03"; input.EndDate = "2026-11-02";
        Assert.IsInstanceOfType(await controller.Create(input, default), typeof(BadRequestObjectResult));
    }

    [TestMethod]
    public void ControllerRequiresCalendarPermission()
    {
        var attribute = typeof(PersonalCalendarController).GetCustomAttributes(typeof(AuthorizeAttribute), true).Cast<AuthorizeAttribute>().Single();
        Assert.AreEqual("calendar.use", attribute.Policy);
    }

    [TestMethod]
    public async Task HttpPipelineEnforcesPermissionAndAcceptsAllDayEvent()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();
        builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite(connection));
        builder.Services.AddSingleton(TimeProvider.System);
        builder.Services.AddAuthentication("test").AddScheme<AuthenticationSchemeOptions, TestAuthentication>("test", _ => { });
        builder.Services.AddAuthorization();
        builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
        builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();
        builder.Services.AddRateLimiter(o => o.AddConcurrencyLimiter("API", x => { x.PermitLimit = 10; x.QueueLimit = 0; }));
        builder.Services.AddControllers().AddApplicationPart(typeof(PersonalCalendarController).Assembly)
            .AddJsonOptions(o => o.JsonSerializerOptions.PropertyNamingPolicy = null);
        await using var app = builder.Build();
        app.UseRouting(); app.UseRateLimiter(); app.UseAuthentication(); app.UseAuthorization(); app.MapControllers();
        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.EnsureCreatedAsync();
            db.Users.Add(new AppUser { Id = "alice", UserName = "alice" });
            await db.SaveChangesAsync();
        }
        await app.StartAsync();
        var client = app.GetTestClient();
        var request = new PersonalCalendarEventRequest { Title = "Ngày nghỉ", StartDate = "2026-10-27", EndDate = "2026-10-27", AllDay = true, Category = "personal" };
        Assert.AreEqual(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/PersonalCalendar", request)).StatusCode);
        client.DefaultRequestHeaders.Add("X-Test-User", "without-permission");
        Assert.AreEqual(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync("/api/PersonalCalendar", request)).StatusCode);
        client.DefaultRequestHeaders.Remove("X-Test-User");
        client.DefaultRequestHeaders.Add("X-Test-User", "alice");
        var created = await client.PostAsJsonAsync("/api/PersonalCalendar", request);
        Assert.AreEqual(HttpStatusCode.OK, created.StatusCode);
        var list = await client.GetAsync("/api/PersonalCalendar?from=2026-10-01&to=2026-10-31");
        Assert.AreEqual(HttpStatusCode.OK, list.StatusCode);
        Assert.AreEqual(1, JsonDocument.Parse(await list.Content.ReadAsStringAsync()).RootElement.GetArrayLength());
    }

    private sealed class TestAuthentication(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
        : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var user = Request.Headers["X-Test-User"].ToString();
            if (user == "") return Task.FromResult(AuthenticateResult.NoResult());
            var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, user) };
            if (user == "alice") claims.Add(new Claim("permission", "calendar.use"));
            var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, Scheme.Name));
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(principal, Scheme.Name)));
        }
    }
}
