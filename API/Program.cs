using API.Data;
using API.Interfaces;
using API.IRespositories;
using API.Models;
using API.Respositories;
using API.SignalR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var JWTSetting = builder.Configuration.GetSection("JWTSetting");
var clientConfig = builder.Configuration.GetSection("ClientConfig");
// Add services to the container.
builder.Services.AddScoped<IMstProvinceRespository, MstProvinceRespository>();
builder.Services.AddScoped<IChatRepository, ChatRespository>();
builder.Services.AddScoped<INewsRespository, NewsRespository>();
builder.Services.AddScoped<IAccountRespository, AccountRespository>();
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite("Data Source=auth.db"));

// config jwt 
builder.Services.AddIdentity<AppUser, IdentityRole>().AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

builder.Services.AddAuthentication(opt =>
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

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = @"JWT Authorization Example: 'Bearer your_token_here",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement() {
        {
            new OpenApiSecurityScheme{
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme ,
                    Id = "Bearer"
                },
                Scheme = "outh2",
                Name = "Bearer",
                In = ParameterLocation.Header
            },
            new List<string>()
        }
    });
});

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


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}


// Note: Nếu như không dùng SSL thì disable feature này đi, nếu không nó sẽ tự động chuyển sang https nếu client đang call api dạng http
//Bật SSL: dotnet dev-certs https --trust
//app.UseHttpsRedirection();

app.UseCors("AllowAllOrigins");


app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();



//app.MapPost("broadcast", async (string message, IHubContext<NotificationHub, INotificationClient> context) =>
//{
//    await context.Clients.All.ReceiveMessage(message);
//    return Results.NoContent();
//});


app.MapHub<ChatHub>("chat-hub");

app.Run();
