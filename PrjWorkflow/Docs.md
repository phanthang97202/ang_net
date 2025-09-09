## Document about architecture
    
    + About project 
    https://www.notion.so/Stadium-Project-2199a36679db80a4b4f1d91ae64b08c0 (Private view mode)
    
    + Microservice architecture
    https://www.notion.so/Microservice-1ef9a36679db804bb0e1e3f91d5f184d (Private view mode)
    
    + Git
    https://www.notion.so/GitLab-1d99a36679db80ddb8eae226471b4cc1 (Private view mode)

## Instruction migrate database with command line
    * `DbContext` nằm trong một **Class Library (Infrastructure)**
    * Startup project là **WebApi**
    * Cần sử dụng connection string từ **`appsettings.json` hoặc biến môi trường**

    # 🧾 TÀI LIỆU MIGRATION EF CORE CHO ARCHITECTURE WEBAPI + CLASS LIBRARY

    ## 🧱 1. **Cấu trúc thư mục**
        /src
        ├── angnet.WebApi                👈 Startup project (chạy app)
        │   ├── Program.cs / Startup.cs
        │   ├── appsettings.json         👈 Chứa ConnectionStrings
        │
        ├── angnet.Infrastructure        👈 Nơi chứa DbContext & Migrations
        │   ├── Data
        │   │   ├── AppDbContext.cs
        │   │   ├── AppDbContextFactory.cs 👈 Quan trọng để EF CLI hoạt động
        │   │   └── Persistences/
        │   │       └── Migrations/

    ## ⚙️ 2. **Tạo `AppDbContextFactory` để EF CLI sử dụng `DbContext`**
        using Microsoft.EntityFrameworkCore;
        using Microsoft.EntityFrameworkCore.Design;
        using Microsoft.Extensions.Configuration;
        using System;
        using System.IO;

        namespace angnet.Infrastructure.Data
        {
            public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
            {
                public AppDbContext CreateDbContext(string[] args)
                {
                    var config = new ConfigurationBuilder()
                        .SetBasePath(Directory.GetCurrentDirectory()) // WebApi là startup project
                        .AddJsonFile("appsettings.json", optional: false)
                        .Build();

                    var connectionString = config.GetConnectionString("PostgresqlDb"); // hoặc "LocalDb", "CloudDb"

                    if (string.IsNullOrWhiteSpace(connectionString))
                        throw new InvalidOperationException("Missing connection string!");

                    var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
                    optionsBuilder.UseNpgsql(connectionString); // hoặc UseSqlServer / UseSqlite

                    return new AppDbContext(optionsBuilder.Options);
                }
            }
        }

    ## ⚙️ 3. **Cấu hình `appsettings.json` trong `WebApi`**
        {
        "ConnectionStrings": {
            "PostgresqlDb": "Host=localhost;Database=angnet;Username=postgres;Password=Admin123!?"
        }
        }

    ## 🖥️ 4. **Các lệnh CLI cần nhớ**
        > ⚠️ Luôn **đứng tại thư mục `angnet.WebApi`** để chạy các lệnh sau.

    ### ✅ Thêm Migration
        dotnet ef migrations add <MigrationName> `
        --project "../angnet.Infrastructure" `
        --output-dir "Data/Persistences/Migrations"

            Ví dụ:
                dotnet ef migrations add InitialCreate `
                --project "../angnet.Infrastructure" `
                --output-dir "Data/Persistences/Migrations"

    ### ✅ Cập nhật CSDL (apply migration)
        dotnet ef database update `
        --project "../angnet.Infrastructure"

    ### ✅ Gỡ Migration cuối (nếu sai)
        dotnet ef migrations remove `
        --project "../angnet.Infrastructure"

    ## 💡 5. **Dùng biến môi trường thay vì appsettings.json (tuỳ chọn)**
        Trong `AppDbContextFactory.cs`:
            var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");
            Set biến tạm thời khi chạy lệnh:
                $env:DB_CONNECTION_STRING = "Host=localhost;Database=...;..."
                dotnet ef migrations add ...

    ## ✅ 6. Kiểm tra nhanh nếu migration thành công
        * Trong thư mục `angnet.Infrastructure\Data\Persistences\Migrations` bạn sẽ thấy file:
            YYYYMMDDHHMMSS_MigrationName.cs
            * Trong CSDL bạn sẽ thấy bảng `__EFMigrationsHistory`
    

    ## 📎 Tài nguyên hữu ích
        * EF Core CLI Docs: [https://learn.microsoft.com/en-us/ef/core/cli/dotnet](https://learn.microsoft.com/en-us/ef/core/cli/dotnet)
        * EF Design-time DbContext: [https://learn.microsoft.com/en-us/ef/core/cli/dbcontext-creation](https://learn.microsoft.com/en-us/ef/core/cli/dbcontext-creation)

## Order stadium
     [Pending] ---Nhân viên xác nhận---> [Confirmed]
     |                                   |
     | Khách thanh toán cọc              | Khách thanh toán full
     v                                   v
 [Cancelled] <--- Hủy đơn --- [Deposited] ---> [Paid]
                                |                |
                                | Khách trả nốt  |
                                v                v
                           [Refunded]       [Playing]
                                                |
                                                v
                                            [Completed]
