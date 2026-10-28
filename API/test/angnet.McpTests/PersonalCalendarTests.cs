using System.Security.Claims;
using System.Text.Json;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Services;
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
    public async Task WeeklySeriesExpandsOvernightAndIsPrivate()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        db.Users.AddRange(new AppUser { Id = "alice", UserName = "alice" }, new AppUser { Id = "bob", UserName = "bob" });
        await db.SaveChangesAsync();
        var controller = new PersonalCalendarController(db, TimeProvider.System, new LookupListService(db, TimeProvider.System)) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        void User(string id) => controller.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, id)], "test"));
        User("alice");
        var request = new PersonalCalendarEventRequest { Title = "Trực", StartDate = "2026-10-29", EndDate = "2026-10-30", StartTime = "19:00", EndTime = "07:00", Category = "work", RepeatDays = 16 | 64, RepeatUntil = "2026-11-05" };
        Assert.IsInstanceOfType(await controller.Create(request, default), typeof(OkObjectResult));
        var list = JsonSerializer.SerializeToElement(((OkObjectResult)await controller.List("2026-10-30", "2026-11-08", default)).Value);
        Assert.AreEqual(3, list.GetArrayLength());
        Assert.AreEqual("2026-10-29", list[0].GetProperty("StartDate").GetString());
        Assert.AreEqual("2026-10-30", list[0].GetProperty("EndDate").GetString());
        Assert.AreEqual("2026-11-05", list[2].GetProperty("StartDate").GetString());
        Assert.AreEqual("2026-10-29", list[2].GetProperty("SeriesStartDate").GetString());
        User("bob");
        Assert.AreEqual(0, JsonSerializer.SerializeToElement(((OkObjectResult)await controller.List("2026-10-30", "2026-11-08", default)).Value).GetArrayLength());
        User("alice");
        request.RepeatDays = 128;
        Assert.IsInstanceOfType(await controller.Create(request, default), typeof(BadRequestObjectResult));
        request.RepeatDays = 16; request.RepeatUntil = "2026-10-28";
        Assert.IsInstanceOfType(await controller.Create(request, default), typeof(BadRequestObjectResult));
    }

    [TestMethod]
    public async Task OwnerIsolationOverlapValidationAndVersionConflicts()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        db.Users.AddRange(new AppUser { Id = "alice", UserName = "alice" }, new AppUser { Id = "bob", UserName = "bob" });
        await db.SaveChangesAsync();
        var controller = new PersonalCalendarController(db, TimeProvider.System, new LookupListService(db, TimeProvider.System)) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
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
    public async Task SeriesStatusIsPerOccurrenceAndSurvivesContentEdits()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        db.Users.AddRange(new AppUser { Id = "alice", UserName = "alice" }, new AppUser { Id = "bob", UserName = "bob" });
        await db.SaveChangesAsync();
        var controller = new PersonalCalendarController(db, TimeProvider.System, new LookupListService(db, TimeProvider.System)) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        void User(string id) => controller.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, id)], "test"));
        async Task<string[]> Statuses() => JsonSerializer.SerializeToElement(((OkObjectResult)await controller.List("2026-10-26", "2026-11-15", default)).Value)
            .EnumerateArray().Select(x => x.GetProperty("Status").GetString()!).ToArray();
        User("alice");
        // Thứ Năm hằng tuần: 29/10, 5/11, 12/11.
        var series = new PersonalCalendarEventRequest { Title = "Tập gym", StartDate = "2026-10-29", EndDate = "2026-10-29", StartTime = "18:00", EndTime = "19:00", Category = "routine", RepeatDays = 16, Status = "urgent" };
        var id = JsonSerializer.SerializeToElement(((OkObjectResult)await controller.Create(series, default)).Value).GetProperty("EventId").GetString()!;
        CollectionAssert.AreEqual(new[] { "urgent", "urgent", "urgent" }, await Statuses());

        var done = (OkObjectResult)await controller.SetStatus(id, new PersonalCalendarStatusRequest { Date = "2026-11-05", Status = "done" }, default);
        Assert.AreEqual("done", JsonSerializer.SerializeToElement(done.Value).GetProperty("Status").GetString());
        Assert.IsInstanceOfType(await controller.SetStatus(id, new PersonalCalendarStatusRequest { Date = "2026-11-12", Status = "in_progress" }, default), typeof(OkObjectResult));
        Assert.IsInstanceOfType(await controller.SetStatus(id, new PersonalCalendarStatusRequest { Date = "2026-11-12", Status = "cancelled" }, default), typeof(OkObjectResult));
        CollectionAssert.AreEqual(new[] { "urgent", "done", "cancelled" }, await Statuses());

        Assert.IsInstanceOfType(await controller.SetStatus(id, new PersonalCalendarStatusRequest { Date = "2026-11-06", Status = "done" }, default), typeof(BadRequestObjectResult), "Not an occurrence");
        Assert.IsInstanceOfType(await controller.SetStatus(id, new PersonalCalendarStatusRequest { Date = "2026-10-29", Status = "paused" }, default), typeof(BadRequestObjectResult), "Unknown status");
        User("bob");
        Assert.IsInstanceOfType(await controller.SetStatus(id, new PersonalCalendarStatusRequest { Date = "2026-10-29", Status = "done" }, default), typeof(NotFoundResult));

        User("alice");
        series.Title = "Tập gym buổi tối"; series.Version = 1; series.Status = null;
        Assert.IsInstanceOfType(await controller.Update(id, series, default), typeof(OkObjectResult));
        CollectionAssert.AreEqual(new[] { "urgent", "done", "cancelled" }, await Statuses());
        Assert.IsInstanceOfType(await controller.Delete(id, 2, default), typeof(NoContentResult));
        Assert.AreEqual(0, await db.PersonalCalendarOccurrenceStatus.CountAsync());
    }

    [TestMethod]
    public async Task SingleEventStatusDefaultsToTodoAndChangesOnItsOwnDate()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        db.Users.Add(new AppUser { Id = "alice", UserName = "alice" });
        await db.SaveChangesAsync();
        var controller = new PersonalCalendarController(db, TimeProvider.System, new LookupListService(db, TimeProvider.System)) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        controller.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "alice")], "test"));
        var input = new PersonalCalendarEventRequest { Title = "Nộp báo cáo", StartDate = "2026-10-30", EndDate = "2026-11-01", AllDay = true, Category = "work" };
        var created = JsonSerializer.SerializeToElement(((OkObjectResult)await controller.Create(input, default)).Value);
        var id = created.GetProperty("EventId").GetString()!;
        Assert.AreEqual("todo", created.GetProperty("Status").GetString());

        Assert.IsInstanceOfType(await controller.SetStatus(id, new PersonalCalendarStatusRequest { Date = "2026-10-31", Status = "done" }, default), typeof(BadRequestObjectResult), "Only the start date names the occurrence");
        Assert.IsInstanceOfType(await controller.SetStatus(id, new PersonalCalendarStatusRequest { Date = "2026-10-30", Status = "in_progress" }, default), typeof(OkObjectResult));
        input.Notes = "Gửi trước 17h"; input.Version = 1;
        Assert.IsInstanceOfType(await controller.Update(id, input, default), typeof(OkObjectResult));
        var listed = JsonSerializer.SerializeToElement(((OkObjectResult)await controller.List("2026-10-01", "2026-11-30", default)).Value);
        Assert.AreEqual("in_progress", listed[0].GetProperty("Status").GetString());

        input.Status = "paused";
        Assert.IsInstanceOfType(await controller.Create(input, default), typeof(BadRequestObjectResult));
    }

    [TestMethod]
    public async Task TasksListEveryDateByStatusWithOnlyTheNextSeriesOccurrence()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        db.Users.AddRange(new AppUser { Id = "alice", UserName = "alice" }, new AppUser { Id = "bob", UserName = "bob" });
        await db.SaveChangesAsync();
        var controller = new PersonalCalendarController(db, TimeProvider.System, new LookupListService(db, TimeProvider.System)) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        void User(string id) => controller.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, id)], "test"));
        async Task<string> Create(string title, string date, string? status = null, int repeatDays = 0, string? until = null) =>
            JsonSerializer.SerializeToElement(((OkObjectResult)await controller.Create(new PersonalCalendarEventRequest { Title = title, StartDate = date, EndDate = date, AllDay = true, Category = "work", Status = status, RepeatDays = repeatDays, RepeatUntil = until }, default)).Value)
                .GetProperty("EventId").GetString()!;
        async Task<JsonElement> Tasks(string? status) => JsonSerializer.SerializeToElement(((OkObjectResult)await controller.Tasks(status, "2026-10-28", default)).Value);
        static string[] Rows(JsonElement tasks) => tasks.GetProperty("Items").EnumerateArray()
            .Select(x => $"{x.GetProperty("StartDate").GetString()} {x.GetProperty("Title").GetString()}").ToArray();

        User("bob");
        await Create("Việc của Bob", "2026-10-28", "urgent");
        User("alice");
        await Create("Gửi hồ sơ", "2026-09-10", "urgent");
        await Create("Nộp báo cáo", "2026-12-20", "urgent");
        await Create("Đi chợ", "2026-10-28", "done");
        // Thứ Năm hằng tuần từ 1/10, không ngày kết thúc; hôm nay là thứ Tư 28/10.
        var gym = await Create("Tập gym", "2026-10-01", repeatDays: 16);
        await Create("Chuỗi đã kết thúc", "2026-09-07", "urgent", repeatDays: 2, until: "2026-09-28");
        await controller.SetStatus(gym, new PersonalCalendarStatusRequest { Date = "2026-10-29", Status = "done" }, default);
        await controller.SetStatus(gym, new PersonalCalendarStatusRequest { Date = "2026-10-08", Status = "urgent" }, default);

        var urgent = await Tasks("urgent");
        CollectionAssert.AreEqual(new[] { "2026-09-10 Gửi hồ sơ", "2026-10-08 Tập gym", "2026-12-20 Nộp báo cáo" }, Rows(urgent));
        Assert.AreEqual(3, urgent.GetProperty("Total").GetInt32());
        var counts = urgent.GetProperty("Counts");
        Assert.AreEqual(3, counts.GetProperty("urgent").GetInt32());
        Assert.AreEqual(2, counts.GetProperty("done").GetInt32());
        Assert.AreEqual(1, counts.GetProperty("todo").GetInt32());
        // Buổi 29/10 đã đổi riêng nên buổi kế tiếp chưa đổi là 5/11.
        var todo = await Tasks("todo");
        CollectionAssert.AreEqual(new[] { "2026-11-05 Tập gym" }, Rows(todo));
        Assert.AreEqual("2026-10-01", todo.GetProperty("Items")[0].GetProperty("SeriesStartDate").GetString());
        CollectionAssert.AreEqual(new[] { "2026-10-29 Tập gym", "2026-10-28 Đi chợ" }, Rows(await Tasks("done")));
        var all = await Tasks(null);
        Assert.AreEqual(0, all.GetProperty("Items").GetArrayLength());
        Assert.AreEqual(6, all.GetProperty("Total").GetInt32());

        Assert.IsInstanceOfType(await controller.Tasks("paused", "2026-10-28", default), typeof(BadRequestObjectResult));
        Assert.IsInstanceOfType(await controller.Tasks("urgent", "28/10/2026", default), typeof(BadRequestObjectResult));
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
        builder.Services.AddScoped<LookupListService>();
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
