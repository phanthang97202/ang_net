using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace angnet.Infrastructure.Data.Services.Tests
{
    [TestClass]
    public class NoteServiceTests
    {
        [TestMethod]
        public async Task Create_SanitizesAnonymousHtmlBeforeSaving()
        {
            using SqliteConnection connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();
            await using AppDbContext dbContext = CreateContext(connection);
            await dbContext.Database.EnsureCreatedAsync();
            await EnableFeature(dbContext);

            NoteService service = new NoteService(dbContext);
            ApiResponse<NoteDto> response = await service.Create(new NoteCreateDto
            {
                Alias = "  Khách   lạ  ",
                ContentBody = "<p onclick=\"alert(1)\">Xin <strong>chào</strong>"
                    + "<script>alert(2)</script><img src=x onerror=alert(3)></p>"
            });

            Assert.IsTrue(response.Success);
            Assert.AreEqual("Khách lạ", response.Data.Alias);
            Assert.IsFalse(response.Data.ContentBody.Contains("<script", StringComparison.OrdinalIgnoreCase));
            Assert.IsFalse(response.Data.ContentBody.Contains("onclick", StringComparison.OrdinalIgnoreCase));
            Assert.IsFalse(response.Data.ContentBody.Contains("<img", StringComparison.OrdinalIgnoreCase));
            Assert.IsTrue(response.Data.ContentBody.Contains("<strong>chào</strong>"));
            Assert.AreEqual(1, await dbContext.Note.CountAsync());
        }

        [TestMethod]
        public async Task Create_WhenNoteMenuIsDisabled_DoesNotSave()
        {
            using SqliteConnection connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();
            await using AppDbContext dbContext = CreateContext(connection);
            await dbContext.Database.EnsureCreatedAsync();

            dbContext.SysMenu.Add(new SysMenuModel
            {
                MenuId = "note",
                TitleVi = "Ghi chú",
                TitleEn = "Notes",
                Path = "/note",
                Icon = "form",
                FlagActive = false,
                CreatedBy = "system",
                UpdatedBy = "system",
                CreatedDTime = DateTime.UtcNow,
                UpdatedDTime = DateTime.UtcNow,
            });
            await dbContext.SaveChangesAsync();

            NoteService service = new NoteService(dbContext);
            ApiResponse<NoteDto> response = await service.Create(new NoteCreateDto
            {
                Alias = "Khách",
                ContentBody = "<p>Nội dung hợp lệ</p>"
            });

            Assert.IsFalse(response.Success);
            Assert.AreEqual(0, await dbContext.Note.CountAsync());
        }

        private static AppDbContext CreateContext(SqliteConnection connection)
        {
            DbContextOptions<AppDbContext> options = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite(connection)
                .Options;
            return new AppDbContext(options);
        }

        private static async Task EnableFeature(AppDbContext dbContext)
        {
            dbContext.SysMenu.Add(new SysMenuModel
            {
                MenuId = "note",
                TitleVi = "Ghi chú",
                TitleEn = "Notes",
                Path = "/note",
                Icon = "form",
                FlagActive = true,
                CreatedBy = "system",
                UpdatedBy = "system",
                CreatedDTime = DateTime.UtcNow,
                UpdatedDTime = DateTime.UtcNow,
            });
            await dbContext.SaveChangesAsync();
        }
    }
}
