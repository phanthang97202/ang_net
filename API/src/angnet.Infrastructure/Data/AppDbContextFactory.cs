using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace angnet.Infrastructure.Data
{
    public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
    {
        public AppDbContext CreateDbContext(string[] args)
        {
            // Tự nạp file cấu hình
            var config = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory()) // EF sẽ dùng thư mục WebApi làm working dir
                .AddJsonFile("appsettings.json", optional: false)
                .Build();

            // Lấy chuỗi kết nối
            var connectionString = config.GetConnectionString("PostgresqlDb");

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException("Connection string 'PostgresqlDb' not found.");
            }

            var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
            optionsBuilder.UseNpgsql(connectionString); // hoặc UseSqlServer/UseSqlite tuỳ db bạn dùng

            return new AppDbContext(optionsBuilder.Options);
        }
    }
}
