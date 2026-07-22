using angnet.WebApi.SignalR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using System.Text;
using StackExchange.Redis;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;
using angnet.WebApi.MIddlewares;
using angnet.Infrastructure.Data; 
using angnet.Utility.CommonUtils;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Http.Timeouts;
using angnet.WebApi.Authorization_Policy;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Authorization;
using angnet.Domain.Models;
using angnet.Infrastructure;

// Chỗ này nó tự động load appsettings.json và appsettings.{Environment}.json
var builder = WebApplication.CreateBuilder(args);
var loggerFactory = LoggerFactory.Create(builder =>
{
    builder.AddConsole();

    if (OperatingSystem.IsWindows())
    {
        builder.AddEventLog(); // Chỉ thêm EventLog nếu là Windows
    }
});
var logger = loggerFactory.CreateLogger<Program>();

// =====================================
builder.Configuration
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true) // 👈 Cho phép thiếu
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true)
    .AddEnvironmentVariables();


//builder.Services.AddDbContext<AppDbContext>(options =>
//    options.UseSqlite(builder.Configuration.GetConnectionString("SQLiteConnection")));

var JWTSetting = builder.Configuration.GetSection("JWTSetting");
var redisCloudEnv = builder.Configuration.GetSection("RedisCloud");
var database = builder.Configuration.GetSection("ConnectionStrings");
var clientConfig = builder.Configuration.GetSection("ClientConfig");
string RedisUrl = redisCloudEnv.GetSection("RedisUrl").Value;
int RedisPort = TCommonUtils.ConvertToInt(redisCloudEnv.GetSection("RedisPort").Value);
string RedisUser = (redisCloudEnv.GetSection("RedisUser").Value);
string RedisPassword = (redisCloudEnv.GetSection("RedisPassword").Value);
var AspIdentity = builder.Configuration.GetSection("AspIdentity");

// register infrastructure 
builder.Services.AddInfrastructure();

// inject AppDbContext
// builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite(database["LocalDb"]));
//builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(database["PostgresqlDb"]));
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("PostgresqlDb"), sqlOptions => sqlOptions.EnableRetryOnFailure());
    //options.EnableSensitiveDataLogging(); // Chỉ nên bật trong môi trường phát triển
    //options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
});

// inject Redis 
ConfigurationOptions configRedis = new ConfigurationOptions
{
    EndPoints = { { RedisUrl, RedisPort } },
    User = RedisUser,
    Password = RedisPassword
};
ConnectionMultiplexer connectRedis = ConnectionMultiplexer.Connect(configRedis);
builder.Services.AddSingleton<IConnectionMultiplexer>(sp => connectRedis); // tùy chỉnh logic bên trong bằng lamda

// log service 
builder.Services.AddSingleton(typeof(WriteLog));  

// Identity ASP NET CORE
builder.Services.Configure<IdentityOptions>(options =>
{
    // Số lần nhập sai tối đa trước khi khóa
    options.Lockout.MaxFailedAccessAttempts = Convert.ToInt32(AspIdentity["MaxFailedAccessAttempts"]);

    // Thời gian khóa mặc định (phút)
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(Convert.ToInt32(AspIdentity["LockoutTimeSpan"]));

    // Áp dụng khóa cho user mới
    options.Lockout.AllowedForNewUsers = true;
});

builder.Services.AddIdentity<AppUser, IdentityRole>()
                .AddEntityFrameworkStores<AppDbContext>()
                .AddDefaultTokenProviders();

// config jwt 
builder.Services
        .AddAuthorization(op =>
        {
            op.AddPolicy("IsActiveUser", policy => policy.Requirements.Add(new IsActiveRequirement())); // checking Account is inactive
        })
       .AddAuthentication(opt =>
        {
            opt.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            opt.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            opt.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
        })
       .AddJwtBearer(opt =>
        {
            opt.SaveToken = true; // Thiết lập để lưu lại token sau khi xác thực thành công. Điều này hữu ích khi bạn cần truy cập token trong suốt vòng đời của yêu cầu HTTP.
            opt.RequireHttpsMetadata = false; // Đặt giá trị này thành false để ứng dụng không yêu cầu sử dụng HTTPS trong môi trường phát triển (không nên sử dụng trong sản xuất vì thiếu an toàn). Khi true, ứng dụng sẽ yêu cầu HTTPS.
            opt.TokenValidationParameters = new TokenValidationParameters // Đây là nơi thiết lập các tham số để xác thực và hợp lệ hóa token JWT.
            {
                ValidateIssuer = true, //  Xác thực nguồn gốc (Issuer) của token. Điều này đảm bảo token được phát hành bởi một nguồn đáng tin cậy.
                ValidateAudience = true, // Xác thực người nhận (Audience) của token. Điều này đảm bảo token chỉ dành cho những đối tượng cụ thể.
                ValidateLifetime = true, // Xác thực thời gian sống của token. Token sẽ bị từ chối nếu đã hết hạn.
                ValidateIssuerSigningKey = true, // Xác thực chữ ký của token để đảm bảo rằng token chưa bị giả mạo.
                ValidAudience = JWTSetting["validAudience"], // 
                ValidIssuer = JWTSetting["validIssuer"], // 
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JWTSetting.GetSection("securityKey").Value!)) // Đây là khóa bí mật được dùng để ký token và đảm bảo tính toàn vẹn của nó. Khóa này được tạo bằng cách sử dụng SymmetricSecurityKey với giá trị chuỗi bảo mật (securityKey) được mã hóa dưới dạng UTF-8
            };
        });
//If an authorization handler requires services with scoped lifetimes
//(such as a database context or UserManager), register the handler using AddScoped.
builder.Services.AddScoped<IAuthorizationHandler, IsActiveUserHandler>();


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyHeader()
                   .AllowAnyMethod();
            //.AllowCredentials();
        });
});

// Prevent DDoS attack (free) // [EnableRateLimitingAttribute("API")]
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("API", limiter =>
    {
        //Ý nghĩa: Thời gian một "cửa sổ" giới hạn(10 giây).
        //Tác dụng:
        //  Mọi request sẽ được tính trong khoảng thời gian 10 giây này.
        //  Sau 10 giây, bộ đếm reset lại từ đầu.
        //Ví dụ: Nếu có 100 requests trong 5 giây đầu → phải đợi 5 giây nữa để cửa sổ reset.
        limiter.Window = TimeSpan.FromSeconds(10);  // (1) Cửa sổ thời gian

        //Ý nghĩa: Số request tối đa cho phép trong một cửa sổ thời gian(Window).
        //Tác dụng:
        //  Nếu vượt quá 100 requests / 10 giây từ 1 client → trả về HTTP 429 Too Many Requests.
        //  Giúp ngăn flood request từ một IP.
        //Lưu ý: Nên điều chỉnh theo lưu lượng thực tế(API công khai cần giá trị cao hơn).
        limiter.PermitLimit = 100;                  // (2) Số request tối đa

        //Ý nghĩa: Số request được phép xếp hàng chờ khi đạt PermitLimit.
        //Tác dụng:
        //  Khi đạt 100 requests, các request tiếp theo(tối đa 10) sẽ được xếp hàng chờ.
        //  Nếu hàng đợi đầy → trả về 429 ngay lập tức.
        //Ví dụ:
        //  Request 101 → 110: Xếp hàng chờ.
        //  Request 111 +: Bị từ chối ngay.
        limiter.QueueLimit = 10;                    // (3) Số request được xếp hàng

        //limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });

    // Riêng cho VisitStats/Ping (heartbeat gọi định kỳ) - giới hạn theo từng IP,
    // tách biệt với bucket "API" dùng chung để traffic heartbeat không ăn vào
    // quota của các endpoint nội dung khác (News/Search, MstProvince, ...)
    options.AddPolicy("VisitPing", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                Window = TimeSpan.FromSeconds(60),
                PermitLimit = 4,
                QueueLimit = 0
            }));

    // Tùy chọn: thay vì trả 503, trả 429 Too Many Requests
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // (Optional) Log hoặc trả thông điệp custom khi bị chặn
    options.OnRejected = async (context, token) =>
    {
        // Ghi log khi bị từ chối
        logger.LogWarning("Rate limit exceeded from IP: {IP}, Path: {Path}",
            context.HttpContext.Connection.RemoteIpAddress,
            context.HttpContext.Request.Path);

        // Trả về thông báo JSON
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync("{\"error\": \"Too many requests. Please try again later.\"}", token);
    };
});

builder.Services.Configure<RequestTimeoutOptions>(options =>
{
    //Ý nghĩa: Thời gian tối đa một request được phép xử lý.
    //Tác dụng:
    //  Nếu request chạy quá 30 giây → tự động hủy.
    //  Ngăn các request "treo" do tấn công Slowloris(DDoS kéo dài kết nối).
    //Lưu ý:
    //  Với API có xử lý phức tạp(upload file lớn), cần tăng giá trị này.
    //  Có thể áp dụng riêng cho từng endpoint:
    options.AddPolicy("API", TimeSpan.FromSeconds(30)); // dùng cách này thì phải gắn Attribute thủ công  [RequestTimeout("API")]
});

//// Kestrel config cho test Slowloris
//builder.WebHost.ConfigureKestrel(options =>
//{
//    options.ListenAnyIP(5000); // Hoặc chỉ ListenLocalhost nếu cần

//    // Các giới hạn xử lý connection
//    options.Limits.MaxConcurrentConnections = 10000; // Tuỳ cấu hình máy
//    options.Limits.MaxConcurrentUpgradedConnections = 10000;

//    // Thời gian chờ header gửi đến (Slowloris hay lợi dụng cái này)
//    options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(300); // Đặt cao nếu muốn server "chịu trận"

//    // Nếu muốn test server dễ sập, set timeout cực cao
//    // Nếu muốn thấy server bảo vệ tốt, giảm xuống thấp (5s hoặc 10s)

//    // Keep-alive timeout: thời gian giữ connection nếu client không gửi gì
//    options.Limits.KeepAliveTimeout = TimeSpan.FromSeconds(120);

//    // Cấu hình tối đa body size nếu muốn kiểm thử thêm layer
//    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024; // 10MB
//});


builder.Services.AddControllers(options =>
{
    var policyBuilder = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser();

    policyBuilder.Requirements.Add(new IsActiveRequirement());

    var policy = policyBuilder.Build();

    options.Filters.Add(new AuthorizeFilter(policy));
});



// Config Logs  
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
    .WriteTo.Console(new Serilog.Formatting.Json.JsonFormatter())
    .WriteTo.File(new Serilog.Formatting.Json.JsonFormatter(), "RuntimeData/Logs/log.json", rollingInterval: RollingInterval.Day)
    .Filter.ByExcluding(logEvent =>
        logEvent.Properties.ContainsKey("SkipLogging") &&
        logEvent.Properties["SkipLogging"].ToString() == "True")
    .CreateLogger();

builder.Host.UseSerilog();


// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
//builder.Services.AddSwaggerGen(c =>
//{
//    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
//    {
//        Description = @"JWT Authorization Example: 'Bearer your_token_here",
//        Name = "Authorization",
//        In = ParameterLocation.Header,
//        Type = SecuritySchemeType.ApiKey,
//        Scheme = "Bearer"
//    });

//    c.AddSecurityRequirement(new OpenApiSecurityRequirement() {
//        {
//            new OpenApiSecurityScheme{
//                Reference = new OpenApiReference
//                {
//                    Type = ReferenceType.SecurityScheme ,
//                    Id = "Bearer"
//                },
//                Scheme = "outh2",
//                Name = "Bearer",
//                In = ParameterLocation.Header
//            },
//            new List<string>()
//        }
//    });
//});

//builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options =>
//{ 
//    options.SerializerOptions.PropertyNamingPolicy = null;
//});

builder.Services.Configure<ApiBehaviorOptions>(o =>
{
    o.SuppressModelStateInvalidFilter = true;
});

builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = null;
});

// config signalR
builder.Services.AddSignalR();

var app = builder.Build();
app.UseRateLimiter(); // Prevent DDoS attack (free)
app.Use(async (context, next) =>
{
    var badIPs = new[] { "192.168.1.44" };
    if (badIPs.Contains(context.Connection.RemoteIpAddress?.ToString()))
    {
        context.Response.StatusCode = 403;
        return;
    }
    await next();
});

// Middleware bảo mật
app.Use(async (context, next) =>
{
    //Mục đích: Chống clickjacking
    //Tác dụng: Ngăn trang web của bạn bị nhúng trong<iframe>
    context.Response.Headers.Add("X-Frame-Options", "DENY");

    //Mục đích: Chống MIME sniffing
    //Tác dụng: Buộc trình duyệt tôn trọng Content-Type
    //Ví dụ phòng ngừa:
    //File upload .jpg nhưng thực chất là.js → Trình duyệt sẽ không thực thi nếu header này có
    context.Response.Headers.Add("X-Content-Type-Options", "nosniff");

    //Mục đích: Bảo vệ thông tin người dùng
    //Tác dụng: Không gửi URL nguồn(referrer) khi chuyển trang
    context.Response.Headers.Add("Referrer-Policy", "no-referrer");

    //CSP Header(Chống XSS):
    context.Response.Headers.Add("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'");

    // HSTS Header (Bắt buộc HTTPS):
    context.Response.Headers.Add("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

    await next();
});

app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
app.UseMiddleware<UserEnricherMiddleware>();
app.UseSerilogRequestLogging(); // tự động log thông tin HTTP request

// Configure the HTTP request pipeline.
//if (app.Environment.IsDevelopment())
//{
//    // app.UseSwagger();
//    // app.UseSwaggerUI();
//}

app.UseMiddleware<LoggingMiddleware>();

// Note: Nếu như không dùng SSL thì disable feature này đi, nếu không nó sẽ tự động chuyển sang https nếu client đang call api dạng http
//Bật SSL: dotnet dev-certs https --trust
//app.UseHttpsRedirection();

app.UseCors("AllowAllOrigins");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();
app.MapGet("/api/health", () => Results.Ok("Alive")); // simple health check endpoint for Render, trigger Render dont cold sleep
app.MapMethods("/api/health", new[] { "HEAD" }, () => Results.Ok("Alive")); // simple health check endpoint for Render, trigger Render dont cold sleep


//app.MapPost("broadcast", async (string message, IHubContext<NotificationHub, INotificationClient> context) =>
//{
//    await context.Clients.All.ReceiveMessage(message);
//    return Results.NoContent();
//});

app.MapHub<ChatHub>("chat-hub");

// -----------Auto tracking port in production----------------------
if (app.Environment.IsProduction())
{
    var port = Environment.GetEnvironmentVariable("PORT") ?? "80";
    app.Urls.Add($"http://*:{port}");
}

//using (var scope = app.Services.CreateScope())
//{
//    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
//    db.Database.Migrate();
//}

app.Run();
