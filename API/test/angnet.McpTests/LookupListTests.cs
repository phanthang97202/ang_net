using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Text.Json;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Services;
using angnet.WebApi.Authorization_Policy;
using angnet.WebApi.Controllers;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

[TestClass]
public class LookupListTests
{
    private static async Task<(SqliteConnection Connection, AppDbContext Db)> Database()
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        db.Users.AddRange(new AppUser { Id = "alice", UserName = "alice" }, new AppUser { Id = "bob", UserName = "bob" });
        await db.SaveChangesAsync();
        return (connection, db);
    }

    [TestMethod]
    public async Task DefaultsAreCopiedPerUserAndStayPrivate()
    {
        var (connection, db) = await Database();
        await using var _ = connection; await using var __ = db;
        var service = new LookupListService(db, TimeProvider.System);

        var statuses = await service.ListAsync("alice", LookupListCodes.CalendarStatus, false, default);
        CollectionAssert.AreEqual(new[] { "todo", "in_progress", "urgent", "done", "cancelled" }, statuses.Select(x => x.Code).ToArray());
        var expenses = await service.ListAsync("alice", LookupListCodes.ExpenseCategory, false, default);
        Assert.AreEqual("income", expenses.Single(x => x.Code == "salary").Kind);
        Assert.AreEqual("Food & drinks", expenses.Single(x => x.Code == "food").NameEn);

        // Đổi tên bên alice không ảnh hưởng bob
        var todo = statuses[0];
        await service.UpdateAsync("alice", todo.Id, new LookupItemRequest { NameVi = "Việc mới", NameEn = "New", Color = "#112233" }, default);
        Assert.AreEqual("Cần làm", (await service.ListAsync("bob", LookupListCodes.CalendarStatus, false, default))[0].NameVi);
        // bob không sửa / xóa / đổi thứ tự được mục của alice
        Assert.AreEqual(LookupResult.NotFound, (await service.UpdateAsync("bob", todo.Id, new LookupItemRequest { NameVi = "x" }, default)).Result);
        Assert.AreEqual(LookupResult.NotFound, await service.DeleteAsync("bob", todo.Id, default));
        Assert.AreEqual(LookupResult.NotFound, await service.MoveAsync("bob", todo.Id, "down", default));
        // Lần gọi sau không chép thêm
        Assert.AreEqual(5, (await service.ListAsync("alice", LookupListCodes.CalendarStatus, true, default)).Count);
    }

    [TestMethod]
    public async Task ValidatesItemsAndFillsMissingLanguage()
    {
        var (connection, db) = await Database();
        await using var _ = connection; await using var __ = db;
        var service = new LookupListService(db, TimeProvider.System);

        var (result, item) = await service.CreateAsync("alice", LookupListCodes.CalendarCategory, new LookupItemRequest { NameEn = "Gym", Color = "#ABCDEF" }, default);
        Assert.AreEqual(LookupResult.Ok, result);
        Assert.AreEqual("Gym", item!.NameVi, "Thiếu tên tiếng Việt thì lấy tên tiếng Anh");
        Assert.AreEqual("#abcdef", item.Color);
        Assert.AreEqual("", item.Kind, "Kind chỉ dành cho danh mục thu chi");
        Assert.IsTrue(item.Code.Length <= 16);

        Assert.AreEqual(LookupResult.Invalid, (await service.CreateAsync("alice", LookupListCodes.CalendarCategory, new LookupItemRequest(), default)).Result);
        Assert.AreEqual(LookupResult.Invalid, (await service.CreateAsync("alice", LookupListCodes.CalendarCategory, new LookupItemRequest { NameVi = "x", Color = "red" }, default)).Result);
        Assert.AreEqual(LookupResult.Invalid, (await service.CreateAsync("alice", LookupListCodes.ExpenseCategory, new LookupItemRequest { NameVi = "x", Kind = "gift" }, default)).Result);
        Assert.AreEqual("both", (await service.CreateAsync("alice", LookupListCodes.ExpenseCategory, new LookupItemRequest { NameVi = "Quà" }, default)).Item!.Kind);
    }

    [TestMethod]
    public async Task DeletingHidesItemsInUseAndRemovesUnusedOnes()
    {
        var (connection, db) = await Database();
        await using var _ = connection; await using var __ = db;
        var service = new LookupListService(db, TimeProvider.System);
        var categories = await service.ListAsync("alice", LookupListCodes.CalendarCategory, false, default);
        db.PersonalCalendarEvent.Add(new PersonalCalendarEventModel
        {
            EventId = Guid.NewGuid().ToString(), OwnerId = "alice", Title = "Trực", StartDate = new DateOnly(2026, 10, 1), EndDate = new DateOnly(2026, 10, 1),
            Category = "work", Status = "done", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var work = categories.Single(x => x.Code == "work");
        Assert.AreEqual(LookupResult.Hidden, await service.DeleteAsync("alice", work.Id, default));
        Assert.IsNull(await service.FindUsableAsync("alice", LookupListCodes.CalendarCategory, "work", null, default), "Mục ẩn không chọn được cho dữ liệu mới");
        Assert.IsNotNull(await service.FindUsableAsync("alice", LookupListCodes.CalendarCategory, "work", "work", default), "Nhưng dữ liệu đang dùng nó vẫn sửa được");
        Assert.AreEqual(LookupResult.Deleted, await service.DeleteAsync("alice", categories.Single(x => x.Code == "leisure").Id, default));
        Assert.AreEqual(3, (await service.ListAsync("alice", LookupListCodes.CalendarCategory, true, default)).Count);
        // Trạng thái đang dùng cũng chỉ ẩn
        var done = (await service.ListAsync("alice", LookupListCodes.CalendarStatus, false, default)).Single(x => x.Code == "done");
        Assert.AreEqual(LookupResult.Hidden, await service.DeleteAsync("alice", done.Id, default));
    }

    [TestMethod]
    public async Task MovesItemsUpAndDown()
    {
        var (connection, db) = await Database();
        await using var _ = connection; await using var __ = db;
        var service = new LookupListService(db, TimeProvider.System);
        var items = await service.ListAsync("alice", LookupListCodes.CalendarCategory, false, default);
        Assert.AreEqual(LookupResult.Ok, await service.MoveAsync("alice", items[2].Id, "up", default));
        CollectionAssert.AreEqual(new[] { "personal", "routine", "leisure", "work" },
            (await service.ListAsync("alice", LookupListCodes.CalendarCategory, false, default)).Select(x => x.Code).ToArray());
        Assert.AreEqual(LookupResult.Invalid, await service.MoveAsync("alice", items[0].Id, "up", default), "Đã ở đầu");
        Assert.AreEqual(LookupResult.Invalid, await service.MoveAsync("alice", items[0].Id, "left", default));
    }

    [TestMethod]
    public async Task ControllerChecksTheModulePermissionOfEachList()
    {
        var (connection, db) = await Database();
        await using var _ = connection; await using var __ = db;
        // alice chỉ có quyền lịch
        var authorization = new Moq.Mock<IAuthorizationService>();
        authorization.Setup(x => x.AuthorizeAsync(Moq.It.IsAny<ClaimsPrincipal>(), Moq.It.IsAny<object?>(), Moq.It.IsAny<string>()))
            .ReturnsAsync((ClaimsPrincipal _, object? _, string policy) => policy == "calendar.use" ? AuthorizationResult.Success() : AuthorizationResult.Failed());
        var service = new LookupListService(db, TimeProvider.System);
        var controller = new LookupListController(service, authorization.Object)
        {
            ControllerContext = new Microsoft.AspNetCore.Mvc.ControllerContext { HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext() }
        };
        void User(string id) => controller.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, id)], "test"));
        User("alice");

        Assert.IsInstanceOfType(await controller.List("CALENDAR_STATUS"), typeof(Microsoft.AspNetCore.Mvc.OkObjectResult));
        Assert.IsInstanceOfType(await controller.List("EXPENSE_CATEGORY"), typeof(Microsoft.AspNetCore.Mvc.ForbidResult));
        Assert.IsInstanceOfType(await controller.List("UNKNOWN"), typeof(Microsoft.AspNetCore.Mvc.BadRequestObjectResult));
        Assert.IsInstanceOfType(await controller.Create("EXPENSE_CATEGORY", new LookupItemRequest { NameVi = "x" }, default), typeof(Microsoft.AspNetCore.Mvc.ForbidResult));

        var created = (Microsoft.AspNetCore.Mvc.OkObjectResult)await controller.Create("CALENDAR_CATEGORY", new LookupItemRequest { NameVi = "Tập gym" }, default);
        var id = JsonSerializer.SerializeToElement(created.Value).GetProperty("Id").GetString()!;
        // Mục thu chi của chính alice cũng không sửa được khi thiếu quyền thu chi
        var expenseItem = (await service.ListAsync("alice", LookupListCodes.ExpenseCategory, false, default))[0];
        Assert.IsInstanceOfType(await controller.Update(expenseItem.Id, new LookupItemRequest { NameVi = "x" }, default), typeof(Microsoft.AspNetCore.Mvc.ForbidResult));

        User("bob");
        Assert.IsInstanceOfType(await controller.Delete(id, default), typeof(Microsoft.AspNetCore.Mvc.NotFoundResult), "Mục của người khác");
        User("alice");
        var deleted = (Microsoft.AspNetCore.Mvc.OkObjectResult)await controller.Delete(id, default);
        Assert.AreEqual("deleted", JsonSerializer.SerializeToElement(deleted.Value).GetProperty("Result").GetString());
    }

    // Cần runtime ASP.NET Core 8 (TestServer); máy chỉ có runtime 10 thì test HTTP lỗi
    // PipeWriter.UnflushedBytes như các test HTTP khác trong project
    [TestMethod]
    public async Task HttpEndpointsCheckTheModulePermissionOfEachList()
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
        builder.Services.AddControllers().AddJsonOptions(o => o.JsonSerializerOptions.PropertyNamingPolicy = null).AddApplicationPart(typeof(LookupListController).Assembly);
        await using var app = builder.Build();
        app.UseRouting(); app.UseRateLimiter(); app.UseAuthentication(); app.UseAuthorization(); app.MapControllers();
        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.EnsureCreatedAsync();
            db.Users.AddRange(new AppUser { Id = "alice", UserName = "alice" }, new AppUser { Id = "bob", UserName = "bob" });
            await db.SaveChangesAsync();
        }
        await app.StartAsync();
        var client = app.GetTestClient();
        Assert.AreEqual(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/LookupList?listCode=CALENDAR_STATUS")).StatusCode);

        // alice chỉ có quyền lịch
        client.DefaultRequestHeaders.Add("X-Test-User", "alice");
        Assert.AreEqual(HttpStatusCode.OK, (await client.GetAsync("/api/LookupList?listCode=CALENDAR_STATUS")).StatusCode);
        Assert.AreEqual(HttpStatusCode.Forbidden, (await client.GetAsync("/api/LookupList?listCode=EXPENSE_CATEGORY")).StatusCode);
        Assert.AreEqual(HttpStatusCode.Forbidden, (await client.GetAsync("/api/LookupList?listCode=CHINESE_TOPIC")).StatusCode);
        Assert.AreEqual(HttpStatusCode.BadRequest, (await client.GetAsync("/api/LookupList?listCode=UNKNOWN")).StatusCode);
        var created = await client.PostAsJsonAsync("/api/LookupList?listCode=CALENDAR_CATEGORY", new LookupItemRequest { NameVi = "Tập gym", NameEn = "Gym", Color = "#22aa66" });
        Assert.AreEqual(HttpStatusCode.OK, created.StatusCode);
        var id = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("Id").GetString()!;
        var managed = await client.GetFromJsonAsync<JsonElement>("/api/LookupList?listCode=CALENDAR_CATEGORY&includeInactive=true");
        Assert.AreEqual(5, managed.GetArrayLength());
        Assert.IsFalse(managed.EnumerateArray().Single(x => x.GetProperty("Id").GetString() == id).GetProperty("InUse").GetBoolean());

        // bob có đủ quyền nhưng không đụng được mục của alice
        client.DefaultRequestHeaders.Remove("X-Test-User"); client.DefaultRequestHeaders.Add("X-Test-User", "bob");
        Assert.AreEqual(HttpStatusCode.NotFound, (await client.PutAsJsonAsync($"/api/LookupList/{id}", new LookupItemRequest { NameVi = "x" })).StatusCode);
        Assert.AreEqual(HttpStatusCode.NotFound, (await client.DeleteAsync($"/api/LookupList/{id}")).StatusCode);

        client.DefaultRequestHeaders.Remove("X-Test-User"); client.DefaultRequestHeaders.Add("X-Test-User", "alice");
        var deleted = await (await client.DeleteAsync($"/api/LookupList/{id}")).Content.ReadFromJsonAsync<JsonElement>();
        Assert.AreEqual("deleted", deleted.GetProperty("Result").GetString());
    }

    private sealed class TestAuthentication(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
        : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var user = Request.Headers["X-Test-User"].ToString();
            if (user == "") return Task.FromResult(AuthenticateResult.NoResult());
            var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, user), new("permission", "calendar.use") };
            if (user == "bob") claims.Add(new Claim("permission", "expenses.use"));
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(new ClaimsIdentity(claims, Scheme.Name)), Scheme.Name)));
        }
    }
}
