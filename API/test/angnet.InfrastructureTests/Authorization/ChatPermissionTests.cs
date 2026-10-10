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
using Microsoft.AspNetCore.RateLimiting;
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
    private readonly UploadHandler uploads = new();
    private bool useActualRepository;
    private AppDbContext Db => scope.ServiceProvider.GetRequiredService<AppDbContext>();
    [TestInitialize] public async Task Start()
    {
        dbConnection = new("Data Source=:memory:"); await dbConnection.OpenAsync();
        var b = WebApplication.CreateBuilder(); b.WebHost.UseUrls("http://127.0.0.1:0"); b.Logging.ClearProviders();
        b.Services.AddDbContext<AppDbContext>(o => o.UseSqlite(dbConnection));
        var clients = new Mock<IHttpClientFactory>();
        clients.Setup(x => x.CreateClient(It.IsAny<string>())).Returns(() => new HttpClient(uploads, false));
        b.Services.AddSingleton(clients.Object);
        b.Services.AddRateLimiter(o => o.AddConcurrencyLimiter("API", limiter => { limiter.PermitLimit = 100; limiter.QueueLimit = 0; }));
        b.Configuration["Cloudinary:CloudName"] = "test-only-cloud";
        b.Configuration["Cloudinary:ApiKey"] = "test-only-key";
        b.Configuration["Cloudinary:ApiSecret"] = "test-only-secret";
        b.Services.AddScoped<AccountSessionService>(); b.Services.AddSingleton<ChatConnections>();
        repo.Setup(x => x.GetMessage(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<long?>())).ReturnsAsync(new ApiResponse<ChatModel>());
        repo.Setup(x => x.SoftDelete(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((string id, string actor) => new ApiResponse<ChatDeletedDto>(new ChatDeletedDto { MessageId = id, Sequence = 1 }));
        repo.Setup(x => x.Notifications(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(new ApiResponse<ChatNotificationDto>(new ChatNotificationDto()));
        repo.Setup(x => x.MarkRead(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<long>())).ReturnsAsync(new ApiResponse<ChatNotificationDto>(new ChatNotificationDto()));
        repo.Setup(x => x.SendMessage(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((string user, string text, string type) => new ApiResponse<ChatModel>(new ChatModel {UserId = user, Message = text, Type = type, Sequence = 1, SenderName = "Database name", SenderAvatar = "https://example.com/db-avatar.jpg"}));
        repo.Setup(x => x.SendImage(It.IsAny<string>(), It.IsAny<byte[]>(), It.IsAny<string>()))
            .ReturnsAsync((string user, byte[] data, string contentType) => new ApiResponse<ChatModel>(new ChatModel {
                UserId = user, Message = "[Hình ảnh]", Type = "image", Sequence = 1 }));
        b.Services.AddScoped<IChatRepository>(sp => {
            if (!useActualRepository) return repo.Object;
            var db = sp.GetRequiredService<AppDbContext>();
            // SQLite does not generate PostgreSQL's non-primary-key identity column.
            db.SavingChanges += (_, _) => {
                foreach (var entry in db.ChangeTracker.Entries<ChatModel>().Where(e => e.State == EntityState.Added && e.Entity.Sequence == 0))
                    entry.Entity.Sequence = 1;
            };
            return new ChatRespository(db);
        });
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
        app.UseDeveloperExceptionPage();
        app.UseAuthentication(); app.UseAuthorization(); app.UseRateLimiter(); app.MapControllers();
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
        Assert.AreEqual("Database name", delivered.GetProperty("arguments")[0].GetProperty("SenderName").GetString());
        Assert.AreEqual("https://example.com/db-avatar.jpg", delivered.GetProperty("arguments")[0].GetProperty("SenderAvatar").GetString());
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
    [TestMethod] public async Task SenderProfiles_ComesFromDatabase_ForSendHistoryAndNotification()
    {
        await Db.Users.Where(u => u.Id == "sender").ExecuteUpdateAsync(s => s
            .SetProperty(u => u.Email, "sender@example.com").SetProperty(u => u.FullName, "Current name")
            .SetProperty(u => u.Avatar, "https://example.com/current-avatar.jpg"));
        // SQLite has no PostgreSQL serial cursor; supply its value for this isolated writer test.
        Db.SavingChanges += (_, _) => {
            foreach (var entry in Db.ChangeTracker.Entries<ChatModel>().Where(e => e.State == EntityState.Added && e.Entity.Sequence == 0))
                entry.Entity.Sequence = 1;
        };
        var actual = new ChatRespository(Db);
        await actual.Notifications("viewer", "account:viewer");
        var sent = (await actual.SendMessage("sender@example.com", "Hello", "string")).Data;
        Assert.AreEqual("Current name", sent.SenderName);
        Assert.AreEqual("https://example.com/current-avatar.jpg", sent.SenderAvatar);
        Db.Chat.AddRange(new ChatModel { Sequence = 2, UserId = "account:sender", Message = "Next", Type = "string" },
            new ChatModel { Sequence = 3, UserId = "deleted@example.com", Message = "Old", Type = "string" });
        await Db.SaveChangesAsync();
        var history = (PageInfo<ChatModel>)(await actual.GetMessage(0, 20)).objResult;
        foreach (var item in history.DataList.Take(2)) {
            Assert.AreEqual("Current name", item.SenderName);
            Assert.AreEqual("https://example.com/current-avatar.jpg", item.SenderAvatar);
        }
        Assert.AreEqual("Người dùng", history.DataList.Last().SenderName);
        await Db.Chat.Where(c => c.Sequence == 3).ExecuteDeleteAsync();
        var latest = (await actual.Notifications("viewer", "account:viewer")).Data.LatestMessage!;
        Assert.AreEqual("Current name", latest.SenderName);
        Assert.AreEqual("https://example.com/current-avatar.jpg", latest.SenderAvatar);
    }

    private async Task<HttpResponseMessage> Upload(int size, string? token, string contentType = "image/png", bool validHeader = true)
    {
        using var form = new MultipartFormDataContent();
        var bytes = new byte[size];
        if (size >= 8 && validHeader)
            new byte[] { 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a }.CopyTo(bytes, 0);
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new(contentType);
        form.Add(file, "file", "test.png");
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/chat/image") { Content = form };
        if (token != null) request.Headers.Authorization = new("Bearer", token);
        return await http.SendAsync(request);
    }
    [TestMethod] public async Task ImageUpload_RequiresPermissions_AndStrictlyLessThan2MB()
    {
        using var anonymous = await Upload(10, null);
        Assert.AreEqual(HttpStatusCode.Unauthorized, anonymous.StatusCode);
        using var viewer = await Upload(10, Token(permissions: ["chat.view"]));
        Assert.AreEqual(HttpStatusCode.Forbidden, viewer.StatusCode);
        using var sendOnly = await Upload(10, Token("sender", ["chat.send"]));
        Assert.AreEqual(HttpStatusCode.Forbidden, sendOnly.StatusCode);
        using var textSender = await Upload(10, Token("sender", ["chat.view", "chat.send"]));
        Assert.AreEqual(HttpStatusCode.Forbidden, textSender.StatusCode);
        using var imageViewer = await Upload(10, Token("sender", ["chat.view", "chat.send_image"]));
        Assert.AreEqual(HttpStatusCode.Forbidden, imageViewer.StatusCode);
        using var imageOnly = await Upload(10, Token("sender", ["chat.send_image"]));
        Assert.AreEqual(HttpStatusCode.Forbidden, imageOnly.StatusCode);
        var sender = Token("sender", ["chat.view", "chat.send", "chat.send_image"]);
        foreach (var size in new[] { 0, 2 * 1024 * 1024, 2 * 1024 * 1024 + 1 }) {
            using var invalid = await Upload(size, sender);
            Assert.AreEqual(HttpStatusCode.BadRequest, invalid.StatusCode);
        }
        using var unsupported = await Upload(10, sender, "text/plain");
        Assert.AreEqual(HttpStatusCode.BadRequest, unsupported.StatusCode);
        using var spoofed = await Upload(10, sender, validHeader: false);
        Assert.AreEqual(HttpStatusCode.BadRequest, spoofed.StatusCode);
        repo.Verify(x => x.SendImage(It.IsAny<string>(), It.IsAny<byte[]>(), It.IsAny<string>()), Times.Never);
        using var valid = await Upload(2 * 1024 * 1024 - 1, sender);
        Assert.AreEqual(HttpStatusCode.OK, valid.StatusCode);
        Assert.AreEqual("image", (await valid.Content.ReadFromJsonAsync<ApiResponse<ChatModel>>())!.Data.Type);
        repo.Verify(x => x.SendImage("account:sender", It.Is<byte[]>(b => b.Length == 2 * 1024 * 1024 - 1), "image/png"), Times.Once);
        using var admin = await Upload(10, Token("sender", admin: true));
        Assert.AreEqual(HttpStatusCode.OK, admin.StatusCode);
        Assert.AreEqual(0, uploads.Calls, "Chat images must never reach Cloudinary");
    }

    [TestMethod] public async Task DatabaseImage_SendBroadcastsMetadata_ViewFetchesBytes_AndDeletionBlocksAccess()
    {
        useActualRepository = true;
        var actual = new ChatRespository(Db);
        await actual.Notifications("viewer", "account:viewer");
        using var viewer = await Socket(Token(permissions: ["chat.view"]));
        var png = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1sAAAAASUVORK5CYII=");
        using var form = new MultipartFormDataContent();
        var content = new ByteArrayContent(png); content.Headers.ContentType = new("image/png");
        form.Add(content, "file", "screenshot.png");
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/chat/image") { Content = form };
        request.Headers.Authorization = new("Bearer", Token("sender", ["chat.view", "chat.send", "chat.send_image"]));
        using var sent = await http.SendAsync(request);
        Assert.AreEqual(HttpStatusCode.OK, sent.StatusCode, await sent.Content.ReadAsStringAsync());
        var message = (await sent.Content.ReadFromJsonAsync<ApiResponse<ChatModel>>())!.Data;
        Assert.AreEqual("image", message.Type);
        Assert.AreEqual("[Hình ảnh]", message.Message);
        Assert.AreEqual("Sender", message.SenderName);
        Assert.AreEqual("account:sender", message.UserId);
        var notification = (await Receive(viewer)).Single(x => x.TryGetProperty("target", out _));
        Assert.AreEqual("ReceiveMessage", notification.GetProperty("target").GetString());
        Assert.IsFalse(notification.GetProperty("arguments")[0].TryGetProperty("Data", out _));
        var history = await actual.GetMessage(0, 20);
        var unread = (await actual.Notifications("viewer", "account:viewer")).Data;
        Assert.AreEqual(1, unread.UnreadCount);
        Assert.AreEqual(message.MessageId, unread.LatestMessage!.MessageId);
        Assert.IsFalse(JsonSerializer.Serialize(history).Contains(Convert.ToBase64String(png)));
        Assert.AreEqual(1, await Db.ChatImages.CountAsync());
        var path = $"/api/chat/{message.MessageId}/image";
        Assert.AreEqual(HttpStatusCode.Unauthorized, await Request(path, null));
        Assert.AreEqual(HttpStatusCode.Forbidden, await Request(path, Token(permissions: ["chat.send"])));
        using var imageRequest = new HttpRequestMessage(HttpMethod.Get, path);
        imageRequest.Headers.Authorization = new("Bearer", Token(permissions: ["chat.view"]));
        using var image = await http.SendAsync(imageRequest);
        Assert.AreEqual(HttpStatusCode.OK, image.StatusCode);
        Assert.AreEqual("image/png", image.Content.Headers.ContentType!.MediaType);
        Assert.IsTrue(image.Headers.CacheControl!.NoStore);
        CollectionAssert.AreEqual(png, await image.Content.ReadAsByteArrayAsync());
        using var deleted = await Delete(Token(permissions: ["chat.view", "chat.delete"]), message.MessageId);
        Assert.AreEqual(HttpStatusCode.OK, deleted.StatusCode);
        Assert.AreEqual(HttpStatusCode.NotFound, await Request(path, Token(permissions: ["chat.view"])));
        Assert.AreEqual(0, (await actual.Notifications("viewer", "account:viewer")).Data.UnreadCount);
        Assert.AreEqual(1, await Db.ChatImages.CountAsync(), "Soft deletion retains the stored image for audit");
        await Db.Users.Where(u => u.Id == "viewer").ExecuteUpdateAsync(s => s.SetProperty(u => u.SessionVersion, 1));
        Assert.AreEqual(HttpStatusCode.Unauthorized, await Request(path, Token(permissions: ["chat.view"])));
        Assert.AreEqual(0, uploads.Calls);
    }
    [TestMethod] public async Task RealSocket_ImagePermissionIsRequiredForImageMessages_ButNotText()
    {
        using var textSender = await Socket(Token("sender", ["chat.view", "chat.send"]));
        var denied = await Invoke(textSender, "https://example.com/a.png", "jpg");
        Assert.IsTrue(denied.Any(x => x.TryGetProperty("error", out _)));
        repo.Verify(x => x.SendMessage(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        Assert.IsFalse((await Invoke(textSender, "Text remains allowed", "string")).Any(x => x.TryGetProperty("error", out _)));
        using var imageViewer = await Socket(Token("viewer", ["chat.view", "chat.send_image"]));
        Assert.IsTrue((await Invoke(imageViewer, "https://example.com/a.png", "jpg")).Any(x => x.TryGetProperty("error", out _)));
        using var imageSender = await Socket(Token("sender", ["chat.view", "chat.send", "chat.send_image"]));
        Assert.IsFalse((await Invoke(imageSender, "https://example.com/a.png", "jpg")).Any(x => x.TryGetProperty("error", out _)));
        using var admin = await Socket(Token("sender", admin: true));
        Assert.IsFalse((await Invoke(admin, "https://example.com/a.png", "jpg")).Any(x => x.TryGetProperty("error", out _)));
        repo.Verify(x => x.SendMessage("account:sender", "https://example.com/a.png", "jpg"), Times.Exactly(2));
        repo.Verify(x => x.SendMessage("account:sender", "Text remains allowed", "string"), Times.Once);
    }
    private async Task<HttpResponseMessage> Delete(string? token, string id = "m1")
    {
        using var request = new HttpRequestMessage(HttpMethod.Delete, $"/api/chat/{id}");
        if (token != null) request.Headers.Authorization = new("Bearer", token);
        return await http.SendAsync(request);
    }
    [TestMethod] public async Task Delete_RequiresPermission_AndBroadcastsToViewers()
    {
        using var anonymous = await Delete(null);
        Assert.AreEqual(HttpStatusCode.Unauthorized, anonymous.StatusCode);
        using var user = await Delete(Token(permissions: ["chat.view", "chat.send"]));
        Assert.AreEqual(HttpStatusCode.Forbidden, user.StatusCode);
        repo.Verify(x => x.SoftDelete(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        using var viewer = await Socket(Token(permissions: ["chat.view"]));
        using var permitted = await Delete(Token(permissions: ["chat.view", "chat.delete"]));
        Assert.AreEqual(HttpStatusCode.OK, permitted.StatusCode, "A normal account with chat.delete can delete");
        repo.Verify(x => x.SoftDelete("m1", "viewer"), Times.Once);
        var permittedEvent = (await Receive(viewer)).Single(x => x.TryGetProperty("target", out _));
        Assert.AreEqual("MessageDeleted", permittedEvent.GetProperty("target").GetString());
        using var admin = await Delete(Token("sender", admin: true));
        Assert.AreEqual(HttpStatusCode.OK, admin.StatusCode);
        repo.Verify(x => x.SoftDelete("m1", "sender"), Times.Once);
        var notification = (await Receive(viewer)).Single(x => x.TryGetProperty("target", out _));
        Assert.AreEqual("MessageDeleted", notification.GetProperty("target").GetString());
        Assert.AreEqual("m1", notification.GetProperty("arguments")[0].GetProperty("MessageId").GetString());
        repo.Setup(x => x.SoftDelete("missing", It.IsAny<string>())).ReturnsAsync(new ApiResponse<ChatDeletedDto>("Missing"));
        using var missing = await Delete(Token(admin: true), "missing");
        Assert.AreEqual(HttpStatusCode.NotFound, missing.StatusCode);
        await Db.Users.Where(u => u.Id == "sender").ExecuteUpdateAsync(s => s.SetProperty(u => u.SessionVersion, 1));
        using var revoked = await Delete(Token("sender", admin: true));
        Assert.AreEqual(HttpStatusCode.Unauthorized, revoked.StatusCode);
        repo.Verify(x => x.SoftDelete("m1", "sender"), Times.Once);
    }
    [TestMethod] public async Task SoftDelete_PreservesRowsAndAudit_ExcludesHistoryAndUnread_AndKeepsCursorPagingStable()
    {
        var actual = new ChatRespository(Db);
        await actual.Notifications("viewer", "account:viewer");
        Db.Chat.AddRange(Enumerable.Range(1, 5).Select(i => new ChatModel { Sequence = i, UserId = "account:sender", Type = "string", Message = $"Message {i}" }));
        await Db.SaveChangesAsync();
        var first = (PageInfo<ChatModel>)(await actual.GetMessage(0, 2)).objResult;
        CollectionAssert.AreEqual(new long[] { 4, 5 }, first.DataList.Select(m => m.Sequence).ToArray());
        var id = first.DataList.Last().MessageId;
        Assert.IsTrue((await actual.SoftDelete(id, "sender")).Success);
        Db.ChangeTracker.Clear();
        var retained = await Db.Chat.SingleAsync(m => m.MessageId == id);
        Assert.IsTrue(retained.IsDeleted);
        Assert.AreEqual("Message 5", retained.Message);
        Assert.AreEqual("sender", retained.DeletedBy);
        Assert.IsNotNull(retained.DeletedAt);
        Assert.AreEqual(5, await Db.Chat.CountAsync());
        var deletedAt = retained.DeletedAt;
        await actual.SoftDelete(id, "viewer");
        Db.ChangeTracker.Clear();
        retained = await Db.Chat.SingleAsync(m => m.MessageId == id);
        Assert.AreEqual("sender", retained.DeletedBy);
        Assert.AreEqual(deletedAt, retained.DeletedAt);
        var notification = (await actual.Notifications("viewer", "account:viewer")).Data;
        Assert.AreEqual(4, notification.UnreadCount);
        Assert.AreEqual(4L, notification.LatestMessage!.Sequence);
        var older = (PageInfo<ChatModel>)(await actual.GetMessage(1, 2, 4)).objResult;
        Assert.AreEqual(4, older.ItemCount);
        CollectionAssert.AreEqual(new long[] { 2, 3 }, older.DataList.Select(m => m.Sequence).ToArray());
        Assert.IsFalse(((PageInfo<ChatModel>)(await actual.GetMessage(0, 20)).objResult).DataList.Any(m => m.MessageId == id));
        Assert.IsTrue((await actual.MarkRead("viewer", "account:viewer", 5)).Success, "A previously displayed deleted cursor must still be acknowledged");
        Assert.AreEqual(0, (await actual.Notifications("viewer", "account:viewer")).Data.UnreadCount);
        Assert.IsFalse((await actual.SoftDelete("missing", "sender")).Success);
    }
    private sealed class UploadHandler : HttpMessageHandler
    {
        public int Calls { get; private set; }
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Calls++;
            Assert.AreEqual("https://api.cloudinary.com/v1_1/test-only-cloud/image/upload", request.RequestUri!.ToString());
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) {
                Content = new StringContent("{\"secure_url\":\"https://example.com/uploaded.png\"}", Encoding.UTF8, "application/json")
            });
        }
    }
}
