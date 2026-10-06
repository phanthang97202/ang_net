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

        [TestMethod]
        public async Task Create_WhenAliasIsBlank_GeneratesAliasAndSaves()
        {
            using SqliteConnection connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();
            await using AppDbContext dbContext = CreateContext(connection);
            await dbContext.Database.EnsureCreatedAsync();
            await EnableFeature(dbContext);

            NoteService service = new NoteService(dbContext);
            ApiResponse<NoteDto> response = await service.Create(new NoteCreateDto
            {
                Alias = "   ",
                ContentBody = "<p>Một ghi chú không nhập bí danh.</p>"
            });

            Assert.IsTrue(response.Success);
            Assert.IsFalse(string.IsNullOrWhiteSpace(response.Data.Alias));
            Assert.AreEqual(response.Data.Alias, (await dbContext.Note.SingleAsync()).Alias);
        }

        [TestMethod]
        public async Task Create_AllowsDuplicateAliases()
        {
            using SqliteConnection connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();
            await using AppDbContext dbContext = CreateContext(connection);
            await dbContext.Database.EnsureCreatedAsync();
            await EnableFeature(dbContext);

            NoteService service = new NoteService(dbContext);
            ApiResponse<NoteDto> first = await service.Create(new NoteCreateDto
            {
                Alias = "Người quen",
                ContentBody = "<p>Ghi chú thứ nhất.</p>"
            });
            ApiResponse<NoteDto> second = await service.Create(new NoteCreateDto
            {
                Alias = "Người quen",
                ContentBody = "<p>Ghi chú thứ hai.</p>"
            });

            Assert.IsTrue(first.Success);
            Assert.IsTrue(second.Success);
            Assert.AreEqual(2, await dbContext.Note.CountAsync(note => note.Alias == "Người quen"));
        }

        [TestMethod]
        public async Task GetUnreadState_WithoutReadMarker_StartsAtZero()
        {
            using SqliteConnection connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();
            await using AppDbContext dbContext = CreateContext(connection);
            await dbContext.Database.EnsureCreatedAsync();
            await EnableFeature(dbContext);

            dbContext.Note.Add(NewNote(DateTime.UtcNow.AddMinutes(-1), true));
            await dbContext.SaveChangesAsync();

            NoteService service = new NoteService(dbContext);
            ApiResponse<NoteUnreadStateDto> response = await service.GetUnreadState(null);

            Assert.IsTrue(response.Success);
            Assert.AreEqual(0, response.Data.UnreadCount);
            Assert.AreNotEqual(default, response.Data.ServerDTime);
        }

        [TestMethod]
        public async Task GetUnreadState_CountsOnlyActiveNotesAfterReadMarker()
        {
            using SqliteConnection connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();
            await using AppDbContext dbContext = CreateContext(connection);
            await dbContext.Database.EnsureCreatedAsync();
            await EnableFeature(dbContext);

            DateTime readMarker = DateTime.UtcNow.AddMinutes(-5);
            dbContext.Note.AddRange(
                NewNote(readMarker.AddMinutes(-1), true),
                NewNote(readMarker.AddMinutes(1), false),
                NewNote(readMarker.AddMinutes(2), true));
            await dbContext.SaveChangesAsync();

            NoteService service = new NoteService(dbContext);
            ApiResponse<NoteUnreadStateDto> response = await service.GetUnreadState(readMarker);

            Assert.IsTrue(response.Success);
            Assert.AreEqual(1, response.Data.UnreadCount);
        }

        private static AppDbContext CreateContext(SqliteConnection connection)
        {
            DbContextOptions<AppDbContext> options = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite(connection)
                .Options;
            return new AppDbContext(options);
        }

        private static NoteModel NewNote(DateTime createdDTime, bool active)
        {
            return new NoteModel
            {
                Alias = "Khách",
                ContentBody = "<p>Ghi chú kiểm thử</p>",
                FlagActive = active,
                CreatedBy = "anonymous",
                UpdatedBy = "anonymous",
                CreatedDTime = createdDTime,
                UpdatedDTime = createdDTime,
            };
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
