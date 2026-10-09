using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Net.WebSockets;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using angnet.Application.Interfaces.Repositories;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Repositories;
using angnet.Infrastructure.Data.Services;
using angnet.WebApi.Authorization_Policy;
using angnet.WebApi.Controllers;
using angnet.WebApi.SignalR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Moq;

namespace angnet.InfrastructureTests.Authorization;
[TestClass, DoNotParallelize]
public class ChatPermissionTests
{
    private const string Secret = "chat-test-only-signing-key-2026-01234567890123456789";
    private WebApplication app = null!;
    private SqliteConnection dbConnection = null!;
    private IServiceScope scope = null!;
    private HttpClient http = null!;
    private readonly Mock<IChatRepository> repo = new();
    private AppDbContext Db => scope.ServiceProvider.GetRequiredService<AppDbContext>();
    [TestInitialize] public async Task Start()
    {
        dbConnection = new("Data Source=:memory:"); await dbConnection.OpenAsync();
        var b = WebApplication.CreateBuilder(); b.WebHost.UseUrls("http://127.0.0.1:0"); b.Logging.ClearProviders();
        b.Services.AddDbContext<AppDbContext>(o => o.UseSqlite(dbConnection));
        b.Services.AddScoped<AccountSessionService>(); b.Services.AddSingleton<ChatConnections>();
        repo.Setup(x => x.GetMessage(It.IsAny<int>(), It.IsAny<int>())).ReturnsAsync(new ApiResponse<ChatModel>());
        repo.Setup(x => x.Notifications(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(new ApiResponse<ChatNotificationDto>(new ChatNotificationDto()));
        repo.Setup(x => x.MarkRead(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<long>())).ReturnsAsync(new ApiResponse<ChatNotificationDto>(new ChatNotificationDto()));
        repo.Setup(x => x.SendMessage(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((string user, string text, string type) => new ApiResponse<ChatModel>(new ChatModel {UserId = user, Message = text, Type = type, Sequence = 1}));
        b.Services.AddSingleton(repo.Object);
        b.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o => {
            o.TokenValidationParameters = new() {ValidateIssuer = false, ValidateAudience = false, ValidateLifetime = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Secret)), ClockSkew = TimeSpan.Zero};
            o.Events = new() {
                OnMessageReceived = c => { if (c.Request.Path.StartsWithSegments("/chat-hub")) c.Token = c.Request.Query["access_token"]; return Task.CompletedTask; },
                OnTokenValidated = async c => { if (!await c.HttpContext.RequestServices.GetRequiredService<AccountSessionService>().IsCurrent(c.Principal!)) c.Fail("Revoked"); }
            };
        });
        b.Services.AddAuthorization();
        b.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
        b.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();
        b.Services.AddSignalR().AddJsonProtocol(o => o.PayloadSerializerOptions.PropertyNamingPolicy = null);
        b.Services.AddControllers().AddJsonOptions(o => o.JsonSerializerOptions.PropertyNamingPolicy = null).AddApplicationPart(typeof(ChatController).Assembly);
        app = b.Build(); scope = app.Services.CreateScope(); await Db.Database.EnsureCreatedAsync();
        Db.Users.AddRange(new AppUser {Id = "viewer", UserName = "viewer", FullName = "Viewer", FlagActive = true},
            new AppUser {Id = "sender", UserName = "sender", FullName = "Sender", FlagActive = true});
        await Db.SaveChangesAsync();
        app.UseAuthentication(); app.UseAuthorization(); app.MapControllers();
        app.MapHub<ChatHub>("/chat-hub", o => o.CloseOnAuthenticationExpiration = true);
        await app.StartAsync(); http = new() {BaseAddress = new Uri(app.Urls.Single())};
    }
    [TestCleanup] public async Task Stop() { http.Dispose(); scope.Dispose(); await app.DisposeAsync(); await dbConnection.DisposeAsync(); }
    private static string Token(string id = "viewer", string[]? permissions = null, bool admin = false, int version = 0)
    {
        var claims = new List<Claim> {new(ClaimTypes.NameIdentifier, id), new(ClaimTypes.Name, id), new(ClaimTypes.Role, admin ? "Admin" : "User"), new("session_version", version.ToString())};
        claims.AddRange((permissions ?? []).Select(p => new Claim("permission", p)));
        return new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(claims: claims, expires: DateTime.UtcNow.AddMinutes(5),
            signingCredentials: new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Secret)), SecurityAlgorithms.HmacSha256)));
    }
    private async Task<HttpStatusCode> Request(string path, string? token, bool post = false)
    {
        using var req = new HttpRequestMessage(post ? HttpMethod.Post : HttpMethod.Get, path);
        if (token != null) req.Headers.Authorization = new("Bearer", token);
        if (post) req.Content = JsonContent.Create(new {Sequence = 0});
        using var res = await http.SendAsync(req); return res.StatusCode;
    }
    [DataTestMethod]
    [DataRow("/api/chat/getmessage", false)] [DataRow("/api/chat/notifications", false)] [DataRow("/api/chat/read", true)]
    public async Task HistoryAndReadState_RequireView(string path, bool post)
    {
        Assert.AreEqual(HttpStatusCode.Unauthorized, await Request(path, null, post));
        Assert.AreEqual(HttpStatusCode.Forbidden, await Request(path, Token(permissions: ["chat.send"]), post));
        Assert.AreEqual(HttpStatusCode.OK, await Request(path, Token(permissions: ["chat.view"]), post));
        Assert.AreEqual(HttpStatusCode.OK, await Request(path, Token(admin: true), post));
    }
    [TestMethod] public async Task HubConnection_RequiresView()
    {
        const string path = "/chat-hub/negotiate?negotiateVersion=1";
        Assert.AreEqual(HttpStatusCode.Unauthorized, await Request(path, null, true));
        Assert.AreEqual(HttpStatusCode.Forbidden, await Request(path, Token(permissions: ["chat.send"]), true));
        Assert.AreEqual(HttpStatusCode.OK, await Request(path, Token(permissions: ["chat.view"]), true));
    }
    private async Task<ClientWebSocket> Socket(string token)
    {
        var socket = new ClientWebSocket();
        var uri = new UriBuilder(http.BaseAddress!) {Scheme = "ws", Path = "/chat-hub", Query = "access_token=" + Uri.EscapeDataString(token)};
        await socket.ConnectAsync(uri.Uri, CancellationToken.None);
        await Send(socket, "{\"protocol\":\"json\",\"version\":1}"); await Receive(socket);
        return socket;
    }
    private static Task Send(ClientWebSocket socket, string json) => socket.SendAsync(new ArraySegment<byte>(Encoding.UTF8.GetBytes(json + "\u001e")), WebSocketMessageType.Text, true, CancellationToken.None);
    private static async Task<List<JsonElement>> Receive(ClientWebSocket socket)
    {
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        var bytes = new byte[16384]; var text = new StringBuilder(); WebSocketReceiveResult result;
        do { result = await socket.ReceiveAsync(new ArraySegment<byte>(bytes), timeout.Token); text.Append(Encoding.UTF8.GetString(bytes, 0, result.Count)); } while (!result.EndOfMessage);
        return text.ToString().Split('\u001e', StringSplitOptions.RemoveEmptyEntries).Select(x => JsonDocument.Parse(x).RootElement.Clone()).ToList();
    }
    private static async Task<List<JsonElement>> Invoke(ClientWebSocket socket, string text = "Hello", string type = "string")
    {
        await Send(socket, JsonSerializer.Serialize(new {type = 1, invocationId = "1", target = "SendMessage", arguments = new[] {"spoofed-other-user", text, type}}));
        var received = new List<JsonElement>();
        while (!received.Any(x => x.TryGetProperty("type", out var t) && t.GetInt32() == 3)) received.AddRange(await Receive(socket));
        return received;
    }
    [TestMethod] public async Task RealSocket_ViewOnlyCannotSend_AndSenderCannotSpoofIdentity()
    {
        using var viewer = await Socket(Token(permissions: ["chat.view"]));
        var denied = await Invoke(viewer);
        Assert.IsTrue(denied.Any(x => x.TryGetProperty("error", out _)));
        repo.Verify(x => x.SendMessage(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        using var sender = await Socket(Token("sender", ["chat.view", "chat.send"]));
        var sent = await Invoke(sender);
        Assert.IsFalse(sent.Any(x => x.TryGetProperty("error", out _)));
        repo.Verify(x => x.SendMessage("account:sender", "Hello", "string"), Times.Once);
        var delivered = (await Receive(viewer)).Single(x => x.TryGetProperty("target", out _));
        Assert.AreEqual("account:sender", delivered.GetProperty("arguments")[0].GetProperty("UserId").GetString());
        await Db.Users.Where(u => u.Id == "viewer").ExecuteUpdateAsync(s => s.SetProperty(u => u.SessionVersion, 1));
        var recipients = await app.Services.GetRequiredService<ChatConnections>().Recipients(
            scope.ServiceProvider.GetRequiredService<AccountSessionService>(), scope.ServiceProvider.GetRequiredService<IAuthorizationService>());
        Assert.AreEqual(1, recipients.Count, "Revoked viewer socket must be excluded");
        var revoked = await Invoke(viewer);
        Assert.IsTrue(revoked.Any(x => x.TryGetProperty("error", out _)));
        foreach (var invalid in new[] {("", "string"), (new string('x', 4001), "string"), ("http://example.com/image.jpg", "jpg")})
            Assert.IsTrue((await Invoke(sender, invalid.Item1, invalid.Item2)).Any(x => x.TryGetProperty("error", out _)));
        await Db.Users.Where(u => u.Id == "sender").ExecuteUpdateAsync(s => s.SetProperty(u => u.SessionVersion, 1));
        Assert.IsTrue((await Invoke(sender)).Any(x => x.TryGetProperty("error", out _)), "A formerly permitted socket cannot send after revocation");
        repo.Verify(x => x.SendMessage(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }
    [TestMethod] public async Task ReadCursor_IsPersistentMonotonicAndExcludesOwnMessages()
    {
        var actual = new ChatRespository(Db);
        Assert.AreEqual(0, (await actual.Notifications("viewer", "account:viewer")).Data.UnreadCount);
        Db.Chat.AddRange(
            new ChatModel {Sequence = 1, UserId = "account:sender", Type = "string", Message = "First"},
            new ChatModel {Sequence = 2, UserId = "account:viewer", Type = "string", Message = "Own"},
            new ChatModel {Sequence = 3, UserId = "account:sender", Type = "jpg", Message = "https://example.com/img.jpg"});
        await Db.SaveChangesAsync();
        var notification = (await actual.Notifications("viewer", "account:viewer")).Data;
        Assert.AreEqual(2, notification.UnreadCount); Assert.AreEqual(3L, notification.LatestMessage!.Sequence);
        Assert.AreEqual("Sender", notification.LatestMessage.SenderName);
        Assert.AreEqual(1, (await actual.MarkRead("viewer", "account:viewer", 1)).Data.UnreadCount);
        Assert.AreEqual(0, (await actual.MarkRead("viewer", "account:viewer", 3)).Data.UnreadCount);
        Assert.AreEqual(0, (await actual.MarkRead("viewer", "account:viewer", 1)).Data.UnreadCount);
        Assert.IsFalse((await actual.MarkRead("viewer", "account:viewer", 999)).Success);
        Db.ChangeTracker.Clear();
        Assert.AreEqual(0, (await new ChatRespository(Db).Notifications("viewer", "account:viewer")).Data.UnreadCount);
        Assert.AreEqual(0, (await actual.Notifications("sender", "account:sender")).Data.UnreadCount, "First use must not alert old history");
    }
}
