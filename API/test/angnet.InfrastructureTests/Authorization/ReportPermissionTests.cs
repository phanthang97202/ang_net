using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using angnet.Domain.Dtos;
using angnet.Infrastructure.Data.Services;
using angnet.WebApi.Authorization_Policy;
using angnet.WebApi.Controllers;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Moq;

namespace angnet.InfrastructureTests.Authorization;

// Exercise real HTTP routing, JWT validation and authorization before mocked
// business services. No database, production credentials or report data is used.
[TestClass]
[DoNotParallelize]
public class ReportPermissionTests
{
    private static readonly string[] Permissions = ["shiftreport.view", "shiftreport.create",
        "shiftreport.update", "shiftreport.delete", "revenuereport.view"];
    private static readonly SymmetricSecurityKey Key = new(Encoding.UTF8.GetBytes(
        "report-authorization-tests-only-signing-key-2026"));
    private static WebApplication _app = null!;
    private static HttpClient _client = null!;
    private static Mock<IShiftReportService> _shifts = null!;
    private static Mock<IRevenueReportService> _revenue = null!;

    [ClassInitialize]
    public static async Task StartServer(TestContext _)
    {
        _shifts = new(MockBehavior.Strict);
        _shifts.Setup(s => s.GetAllAsync(It.IsAny<ShiftReportQueryParams>())).ReturnsAsync(
            new PagedResult<ShiftReportListDto> { Items = [], PageNumber = 1, PageSize = 10 });
        _shifts.Setup(s => s.GetDrinkStockAsync()).ReturnsAsync([]);
        var report = new ShiftReportResponseDto { Id = 1, Transactions = [], RoomSales = [], DrinkSales = [] };
        _shifts.Setup(s => s.GetByIdAsync(It.IsAny<int>())).ReturnsAsync(report);
        _shifts.Setup(s => s.CreateAsync(It.IsAny<CreateShiftReportDto>())).ReturnsAsync(report);
        _shifts.Setup(s => s.UpdateAsync(It.IsAny<UpdateShiftReportDto>())).ReturnsAsync(report);
        _shifts.Setup(s => s.DeleteAsync(It.IsAny<int>())).ReturnsAsync(true);
        _revenue = new(MockBehavior.Strict);
        _revenue.Setup(s => s.GetRevenueReportAsync(It.IsAny<RevenueReportQueryParams>())).ReturnsAsync(
            new RevenueReportResponse { Summary = new(), RevenueByDate = [], RevenueByShiftType = [],
                RevenueByReceptionist = [], RevenueByRoom = [], Details = [] });

        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        builder.Logging.ClearProviders();
        builder.Services.AddSingleton(_shifts.Object);
        builder.Services.AddSingleton(_revenue.Object);
        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
            options.TokenValidationParameters = new TokenValidationParameters {
                ValidateIssuer = true, ValidIssuer = "report-tests",
                ValidateAudience = true, ValidAudience = "report-tests",
                ValidateIssuerSigningKey = true, IssuerSigningKey = Key,
                ValidateLifetime = true, ClockSkew = TimeSpan.Zero
            });
        builder.Services.AddAuthorization();
        builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
        builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();
        builder.Services.AddControllers(options => options.Filters.Add(
            new AuthorizeFilter(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build())))
            .AddApplicationPart(typeof(ShiftReportController).Assembly);
        _app = builder.Build();
        _app.UseAuthentication();
        _app.UseAuthorization();
        _app.MapControllers();
        await _app.StartAsync();
        _client = new HttpClient { BaseAddress = new Uri(_app.Urls.Single()) };
    }

    [ClassCleanup]
    public static async Task StopServer()
    {
        _client?.Dispose();
        if (_app is not null) await _app.DisposeAsync();
    }

    [DataTestMethod]
    [DataRow("GET", "/api/ShiftReport/GetAll", "shiftreport.view", 200)]
    [DataRow("GET", "/api/ShiftReport/GetById/1", "shiftreport.view", 200)]
    [DataRow("GET", "/api/ShiftReport/GetDrinkStock", "shiftreport.view", 200)]
    [DataRow("GET", "/api/ShiftReport/GetSummary", "shiftreport.view", 200)]
    [DataRow("POST", "/api/ShiftReport/Create", "shiftreport.create", 201)]
    [DataRow("PUT", "/api/ShiftReport/Update/1", "shiftreport.update", 200)]
    [DataRow("DELETE", "/api/ShiftReport/Delete/1", "shiftreport.delete", 204)]
    [DataRow("GET", "/api/RevenueReports?receptionistName=Test&shiftType=Day&roomNumber=101", "revenuereport.view", 200)]
    public async Task Endpoints_RequireExactPermissionBeforeCallingServices(
        string method, string path, string permission, int successStatus)
    {
        _shifts.Invocations.Clear();
        _revenue.Invocations.Clear();
        Assert.AreEqual(HttpStatusCode.Unauthorized, await Send(method, path, null), "Anonymous request");
        Assert.AreEqual(HttpStatusCode.Forbidden, await Send(method, path, Token([])), "Logged in without permission");
        Assert.AreEqual(HttpStatusCode.Forbidden, await Send(method, path,
            Token(Permissions.Where(p => p != permission))), "Other permissions must not grant this action");
        Assert.AreEqual(HttpStatusCode.Unauthorized, await Send(method, path,
            Token([permission], expired: true)), "Expired permission token");
        Assert.AreEqual(0, _shifts.Invocations.Count, "Denied requests must not touch reports");
        Assert.AreEqual(0, _revenue.Invocations.Count, "Denied requests must not read revenue");

        Assert.AreEqual((HttpStatusCode)successStatus, await Send(method, path, Token([permission])));
        Assert.AreEqual((HttpStatusCode)successStatus, await Send(method, path, Token([], admin: true)));
        Assert.AreEqual(2, _shifts.Invocations.Count + _revenue.Invocations.Count);
    }

    [TestMethod]
    public void ReportControllers_HaveNoAnonymousActions()
    {
        foreach (var type in new[] { typeof(ShiftReportController), typeof(RevenueReportsController) }) {
            Assert.IsFalse(type.IsDefined(typeof(AllowAnonymousAttribute), true));
            foreach (var action in type.GetMethods().Where(m => m.GetCustomAttributes(true)
                .OfType<Microsoft.AspNetCore.Mvc.Routing.HttpMethodAttribute>().Any())) {
                Assert.IsFalse(action.IsDefined(typeof(AllowAnonymousAttribute), true), action.Name);
                Assert.IsTrue(type.GetCustomAttributes(true).Concat(action.GetCustomAttributes(true))
                    .OfType<AuthorizeAttribute>().Any(a => !string.IsNullOrEmpty(a.Policy)), action.Name);
            }
        }
    }

    private static string Token(IEnumerable<string> permissions, bool admin = false, bool expired = false)
    {
        var claims = permissions.Select(p => new Claim("permission", p)).ToList();
        claims.Add(new Claim(ClaimTypes.NameIdentifier, "test-user"));
        claims.Add(new Claim(ClaimTypes.Role, admin ? "Admin" : "User"));
        var now = DateTime.UtcNow;
        return new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(
            "report-tests", "report-tests", claims, now.AddMinutes(-10),
            expired ? now.AddMinutes(-1) : now.AddMinutes(5), new SigningCredentials(Key, SecurityAlgorithms.HmacSha256)));
    }

    private static async Task<HttpStatusCode> Send(string method, string path, string? token)
    {
        using var request = new HttpRequestMessage(new HttpMethod(method), path);
        if (token is not null) request.Headers.Authorization = new("Bearer", token);
        if (method is "POST" or "PUT") request.Content = JsonContent.Create(new {
            Id = 1, ShiftDate = "2026-10-08", ShiftType = "Day", ReceptionistName = "Test",
            StartTime = "2026-10-08T07:00:00", EndTime = "2026-10-08T19:00:00",
            Transactions = Array.Empty<object>(), RoomSales = Array.Empty<object>(), DrinkSales = Array.Empty<object>()
        });
        using var response = await _client.SendAsync(request);
        return response.StatusCode;
    }
}
