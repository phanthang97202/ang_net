using System.Net;
using System.Net.Http.Json;
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
using Microsoft.Extensions.Configuration;
using System.Text.Encodings.Web;
using angnet.WebApi.Authorization_Policy;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

[TestClass]
public class ChineseLearningTests
{
    [TestMethod]
    public async Task GeneratesValidatedExercisesAndKeepsVocabularyPrivate()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:"); await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        var alice = Guid.NewGuid().ToString(); var bob = Guid.NewGuid().ToString();
        db.Users.AddRange(new AppUser { Id = alice, UserName = alice }, new AppUser { Id = bob, UserName = bob }); await db.SaveChangesAsync();
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["Groq:ApiKey"] = "test-only" }).Build();
        var lookups = new LookupListService(db, TimeProvider.System);
        var controller = new ChineseLearningController(db, new FakeFactory(), config, TimeProvider.System, lookups) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        void User(string id) => controller.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, id)], "test"));
        User(alice);
        Assert.IsInstanceOfType(await controller.Generate(new() { Kind = "sentence", Topic = "hotel" }, default), typeof(OkObjectResult));
        var result = JsonSerializer.SerializeToElement(((OkObjectResult)await controller.Exercises("sentence", "hotel", default)).Value);
        Assert.AreEqual(1, result.GetArrayLength());
        Assert.AreEqual("酒店", result[0].GetProperty("Words")[0].GetProperty("Word").GetString());
        var word = new ChineseSaveWordRequest { Word = "酒店", Pinyin = "jiǔdiàn", Meaning = "khách sạn", Collection = "Công việc" };
        var created = (OkObjectResult)await controller.SaveWord(word, default);
        var id = JsonSerializer.SerializeToElement(created.Value).GetProperty("Id").GetString()!;
        Assert.IsInstanceOfType(await controller.SaveWord(word, default), typeof(ConflictObjectResult));
        User(bob);
        Assert.AreEqual(0, JsonSerializer.SerializeToElement(((OkObjectResult)await controller.Exercises("sentence", "hotel", default)).Value).GetArrayLength());
        Assert.AreEqual(0, JsonSerializer.SerializeToElement(((OkObjectResult)await controller.Vocabulary(default)).Value).GetArrayLength());
        Assert.IsInstanceOfType(await controller.DeleteWord(id, default), typeof(NotFoundResult));
        User(alice);
        Assert.IsInstanceOfType(await controller.DeleteWord(id, default), typeof(NoContentResult));
        Assert.IsInstanceOfType(await controller.Generate(new() { Kind = "invalid", Topic = "hotel" }, default), typeof(BadRequestResult));
    }
    [TestMethod]
    public async Task ManualExercisesAreValidatedSavedAndPrivate()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:"); await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        db.Users.AddRange(new AppUser { Id = "alice", UserName = "alice" }, new AppUser { Id = "bob", UserName = "bob" }); await db.SaveChangesAsync();
        var lookups = new LookupListService(db, TimeProvider.System);
        var controller = new ChineseLearningController(db, new FakeFactory(), new ConfigurationBuilder().Build(), TimeProvider.System, lookups) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        void User(string id) => controller.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, id)], "test"));
        User("alice");
        var request = new ChineseCreateExerciseRequest { Kind = "audio", Topic = "daily", Text = "  你好  ", Pinyin = "nǐ hǎo", Translation = "Xin chào" };
        Assert.IsInstanceOfType(await controller.CreateExercise(request, default), typeof(OkObjectResult));
        var result = JsonSerializer.SerializeToElement(((OkObjectResult)await controller.Exercises("audio", "daily", default)).Value);
        Assert.AreEqual(1, result.GetArrayLength()); Assert.AreEqual("你好", result[0].GetProperty("Text").GetString()); Assert.AreEqual(0, result[0].GetProperty("Words").GetArrayLength());
        request.Text = "  "; Assert.IsInstanceOfType(await controller.CreateExercise(request, default), typeof(BadRequestResult));
        request.Text = new string('a', 501); Assert.IsInstanceOfType(await controller.CreateExercise(request, default), typeof(BadRequestResult));
        User("bob");
        Assert.AreEqual(0, JsonSerializer.SerializeToElement(((OkObjectResult)await controller.Exercises("audio", "daily", default)).Value).GetArrayLength());
    }
    [TestMethod]
    public async Task ExerciseListPagesAllMatchingItemsAndIsPrivate()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:"); await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        db.Users.AddRange(new AppUser { Id = "alice", UserName = "alice" }, new AppUser { Id = "bob", UserName = "bob" });
        db.ChineseExercise.AddRange(Enumerable.Range(0, 105).Select(i => new ChineseExerciseModel { Id = Guid.NewGuid().ToString(), OwnerId = "alice", Kind = "sentence", Topic = "daily", Text = $"句{i}", Pinyin = "jù", Translation = "Câu", CreatedAt = DateTime.UtcNow.AddSeconds(i) }));
        await db.SaveChangesAsync();
        var controller = new ChineseLearningController(db, new FakeFactory(), new ConfigurationBuilder().Build(), TimeProvider.System, new LookupListService(db, TimeProvider.System)) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        void User(string id) => controller.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, id)], "test"));
        User("alice");
        var first = JsonSerializer.SerializeToElement(((OkObjectResult)await controller.ExerciseList("sentence", "daily", 1)).Value);
        var last = JsonSerializer.SerializeToElement(((OkObjectResult)await controller.ExerciseList("sentence", "daily", 6)).Value);
        Assert.AreEqual(105, first.GetProperty("Total").GetInt32()); Assert.AreEqual(20, first.GetProperty("Items").GetArrayLength());
        Assert.AreEqual(5, last.GetProperty("Items").GetArrayLength());
        Assert.AreEqual("句0", last.GetProperty("Items")[4].GetProperty("Text").GetString());
        Assert.IsInstanceOfType(await controller.ExerciseList("sentence", "daily", 0), typeof(BadRequestResult));
        User("bob");
        Assert.AreEqual(0, JsonSerializer.SerializeToElement(((OkObjectResult)await controller.ExerciseList("sentence", "daily", 1)).Value).GetProperty("Total").GetInt32());
    }
    [TestMethod]
    public void ControllerRequiresChinesePermission() => Assert.AreEqual("chinese.use", typeof(ChineseLearningController).GetCustomAttributes(typeof(AuthorizeAttribute), true).Cast<AuthorizeAttribute>().Single().Policy);

    [TestMethod]
    public async Task CustomTopicsAreOwnerScopedAndKeepExercisesWhenRenamedOrHidden()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:"); await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        var alice = Guid.NewGuid().ToString(); var bob = Guid.NewGuid().ToString();
        db.Users.AddRange(new AppUser { Id = alice, UserName = alice }, new AppUser { Id = bob, UserName = bob }); await db.SaveChangesAsync();
        var lookups = new LookupListService(db, TimeProvider.System);
        var (_, topic) = await lookups.CreateAsync(alice, LookupListCodes.ChineseTopic, new LookupItemRequest { NameVi = "Tiếp khách" }, default);
        Assert.IsNotNull(topic);
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["Groq:ApiKey"] = "test-only" }).Build();
        var controller = new ChineseLearningController(db, new FakeFactory(), config, TimeProvider.System, lookups) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        void User(string id) => controller.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, id)], "test"));
        User(alice);
        Assert.IsInstanceOfType(await controller.Generate(new() { Kind = "sentence", Topic = topic.Code }, default), typeof(OkObjectResult));
        var (updated, _) = await lookups.UpdateAsync(alice, topic.Id, new LookupItemRequest { NameVi = "Lễ tân" }, default);
        Assert.AreEqual(LookupResult.Ok, updated);
        Assert.AreEqual(1, JsonSerializer.SerializeToElement(((OkObjectResult)await controller.Exercises("sentence", topic.Code, default)).Value).GetArrayLength());
        Assert.AreEqual(LookupResult.Hidden, await lookups.DeleteAsync(alice, topic.Id, default));
        Assert.IsInstanceOfType(await controller.Generate(new() { Kind = "sentence", Topic = topic.Code }, default), typeof(BadRequestResult));
        Assert.AreEqual(1, JsonSerializer.SerializeToElement(((OkObjectResult)await controller.Exercises("sentence", topic.Code, default)).Value).GetArrayLength());
        User(bob);
        Assert.IsInstanceOfType(await controller.Exercises("sentence", topic.Code, default), typeof(BadRequestResult));
        Assert.IsInstanceOfType(await controller.Generate(new() { Kind = "sentence", Topic = topic.Code }, default), typeof(BadRequestResult));
    }

    [TestMethod]
    public async Task HttpRequiresLoginAndPermission()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:"); await connection.OpenAsync();
        var builder = WebApplication.CreateBuilder(); builder.WebHost.UseTestServer();
        builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite(connection));
        builder.Services.AddSingleton(TimeProvider.System); builder.Services.AddHttpClient(); builder.Services.AddScoped<LookupListService>();
        builder.Services.AddAuthentication("test").AddScheme<AuthenticationSchemeOptions, TestAuthentication>("test", _ => { });
        builder.Services.AddAuthorization(); builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>(); builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();
        builder.Services.AddRateLimiter(o => o.AddConcurrencyLimiter("API", x => { x.PermitLimit = 10; x.QueueLimit = 0; }));
        builder.Services.AddControllers().AddApplicationPart(typeof(ChineseLearningController).Assembly);
        await using var app = builder.Build(); app.UseRouting(); app.UseRateLimiter(); app.UseAuthentication(); app.UseAuthorization(); app.MapControllers();
        using (var scope = app.Services.CreateScope()) { var db = scope.ServiceProvider.GetRequiredService<AppDbContext>(); await db.Database.EnsureCreatedAsync(); db.Users.Add(new AppUser { Id = "alice", UserName = "alice" }); await db.SaveChangesAsync(); }
        await app.StartAsync(); var client = app.GetTestClient();
        Assert.AreEqual(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/ChineseLearning/vocabulary")).StatusCode);
        Assert.AreEqual(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/ChineseLearning/exercise-list?kind=sentence&topic=daily")).StatusCode);
        Assert.AreEqual(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/ChineseLearning/exercises", new ChineseCreateExerciseRequest())).StatusCode);
        client.DefaultRequestHeaders.Add("X-Test-User", "other");
        Assert.AreEqual(HttpStatusCode.Forbidden, (await client.GetAsync("/api/ChineseLearning/vocabulary")).StatusCode);
        Assert.AreEqual(HttpStatusCode.Forbidden, (await client.GetAsync("/api/ChineseLearning/exercise-list?kind=sentence&topic=daily")).StatusCode);
        Assert.AreEqual(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync("/api/ChineseLearning/exercises", new ChineseCreateExerciseRequest())).StatusCode);
        client.DefaultRequestHeaders.Remove("X-Test-User"); client.DefaultRequestHeaders.Add("X-Test-User", "alice");
        Assert.AreEqual(HttpStatusCode.OK, (await client.GetAsync("/api/ChineseLearning/vocabulary")).StatusCode);
    }
    private sealed class TestAuthentication(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        protected override Task<AuthenticateResult> HandleAuthenticateAsync() {
            var user = Request.Headers["X-Test-User"].ToString(); if (user == "") return Task.FromResult(AuthenticateResult.NoResult());
            var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, user) }; if (user == "alice") claims.Add(new Claim("permission", "chinese.use"));
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(new ClaimsIdentity(claims, Scheme.Name)), Scheme.Name)));
        }
    }

    private sealed class FakeFactory : IHttpClientFactory {
        public HttpClient CreateClient(string name) => new(new FakeHandler());
    }
    private sealed class FakeHandler : HttpMessageHandler {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) {
            var content = JsonSerializer.Serialize(new { exercises = new[] { new { text = "我在酒店工作。", pinyin = "wǒ zài jiǔdiàn gōngzuò", translation = "Tôi làm việc ở khách sạn.", words = new[] { new { word = "酒店", pinyin = "jiǔdiàn", meaning = "khách sạn" } } } } });
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = JsonContent.Create(new { choices = new[] { new { message = new { content } } } }) });
        }
    }
}
