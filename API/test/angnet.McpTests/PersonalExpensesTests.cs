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
using angnet.WebApi.Authorization_Policy;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

[TestClass]
public class PersonalExpensesTests
{
    [TestMethod]
    public async Task TransactionsArePrivateValidatedAndVersioned()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        db.Users.AddRange(new AppUser { Id = "alice", UserName = "alice" }, new AppUser { Id = "bob", UserName = "bob" });
        await db.SaveChangesAsync();
        var lookups = new LookupListService(db, TimeProvider.System);
        var controller = new PersonalExpensesController(db, TimeProvider.System, lookups) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        void User(string id) => controller.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, id)], "test"));
        User("alice");
        // Danh mục riêng của alice, chỉ dùng cho khoản chi
        var coffee = (await lookups.CreateAsync("alice", LookupListCodes.ExpenseCategory, new LookupItemRequest { NameVi = "Cà phê", Kind = "expense" }, default)).Item!;
        var input = new PersonalExpenseRequest { Type = "expense", Amount = 50000, Date = "2026-10-27", CategoryCode = coffee.Code, Note = "Sáng" };
        var created = (OkObjectResult)await controller.Create(input, default);
        var createdJson = JsonSerializer.SerializeToElement(created.Value);
        var id = createdJson.GetProperty("Id").GetString()!;
        Assert.AreEqual(coffee.Code, createdJson.GetProperty("CategoryCode").GetString());
        Assert.AreEqual("Cà phê", createdJson.GetProperty("Category").GetString(), "Tên được chụp lại cùng giao dịch");
        // Sai loại: khoản thu không dùng được danh mục chỉ dành cho chi
        Assert.IsInstanceOfType(await controller.Create(new PersonalExpenseRequest { Type = "income", Amount = 1, Date = "2026-10-27", CategoryCode = coffee.Code }, default), typeof(BadRequestObjectResult));
        Assert.AreEqual(1, JsonSerializer.SerializeToElement(((OkObjectResult)await controller.List("2026-10", default)).Value).GetArrayLength());
        Assert.AreEqual(0, JsonSerializer.SerializeToElement(((OkObjectResult)await controller.List("2026-11", default)).Value).GetArrayLength());
        Assert.IsInstanceOfType(await controller.List("2026-13", default), typeof(BadRequestObjectResult));
        User("bob");
        Assert.AreEqual(0, JsonSerializer.SerializeToElement(((OkObjectResult)await controller.List("2026-10", default)).Value).GetArrayLength());
        input.Version = 1;
        Assert.IsInstanceOfType(await controller.Delete(id, 1, default), typeof(NotFoundResult));
        // bob không dùng được mã danh mục của alice
        Assert.IsInstanceOfType(await controller.Create(input, default), typeof(BadRequestObjectResult));
        User("alice");
        // Danh mục đang dùng thì xóa chỉ thành ẩn; giao dịch giữ nguyên danh mục đó vẫn sửa được
        Assert.AreEqual(LookupResult.Hidden, await lookups.DeleteAsync("alice", coffee.Id, default));
        Assert.IsInstanceOfType(await controller.Create(input, default), typeof(BadRequestObjectResult), "Hidden category cannot be picked for new transactions");
        input.Amount = 75000;
        Assert.IsInstanceOfType(await controller.Update(id, input, default), typeof(OkObjectResult));
        Assert.IsInstanceOfType(await controller.Update(id, input, default), typeof(ConflictObjectResult));
        Assert.IsInstanceOfType(await controller.Delete(id, 1, default), typeof(ConflictObjectResult));
        Assert.IsInstanceOfType(await controller.Delete(id, 2, default), typeof(NoContentResult));
        input.Amount = 0;
        Assert.IsInstanceOfType(await controller.Create(input, default), typeof(BadRequestObjectResult));
    }

    [TestMethod]
    public void ControllerRequiresPermission()
    {
        var attribute = typeof(PersonalExpensesController).GetCustomAttributes(typeof(AuthorizeAttribute), true).Cast<AuthorizeAttribute>().Single();
        Assert.AreEqual("expenses.use", attribute.Policy);
    }

    [TestMethod]
    public async Task HttpEndpointsRequireExpensesPermission()
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
        builder.Services.AddControllers().AddApplicationPart(typeof(PersonalExpensesController).Assembly);
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
        Assert.AreEqual(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/PersonalExpenses?month=2026-10")).StatusCode);
        client.DefaultRequestHeaders.Add("X-Test-User", "no-permission");
        Assert.AreEqual(HttpStatusCode.Forbidden, (await client.GetAsync("/api/PersonalExpenses?month=2026-10")).StatusCode);
        client.DefaultRequestHeaders.Remove("X-Test-User"); client.DefaultRequestHeaders.Add("X-Test-User", "alice");
        // "salary" có sẵn trong bộ mặc định, được chép cho alice ở lần đầu dùng
        var request = new PersonalExpenseRequest { Type = "income", Amount = 100000, Date = "2026-10-01", CategoryCode = "salary" };
        Assert.AreEqual(HttpStatusCode.OK, (await client.PostAsJsonAsync("/api/PersonalExpenses", request)).StatusCode);
        Assert.AreEqual(HttpStatusCode.OK, (await client.GetAsync("/api/PersonalExpenses?month=2026-10")).StatusCode);
    }

    private sealed class TestAuthentication(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
        : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var user = Request.Headers["X-Test-User"].ToString();
            if (user == "") return Task.FromResult(AuthenticateResult.NoResult());
            var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, user) };
            if (user == "alice") claims.Add(new Claim("permission", "expenses.use"));
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(new ClaimsIdentity(claims, Scheme.Name)), Scheme.Name)));
        }
    }
}
