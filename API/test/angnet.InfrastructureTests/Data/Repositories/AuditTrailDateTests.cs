using angnet.Domain.Enums;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace angnet.InfrastructureTests.Data.Repositories;

[TestClass]
public class AuditTrailDateTests
{
    [TestMethod] public async Task LocalDayRangeCombinesWithOtherFiltersBeforeCountAndPaging()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        var start = new DateTime(2026, 10, 12, 17, 0, 0, DateTimeKind.Utc);
        db.AuditTrail.AddRange(new[] { start.AddSeconds(-1), start, start.AddDays(1).AddSeconds(-1), start.AddDays(1) }
            .Select(time => new AuditTrailModel { ChangedDTime = time, Description = "Publish", Level = EAuditTrailLevel.WARNING, TrailType = EAuditTrailType.POST }));
        db.AuditTrail.Add(new AuditTrailModel { ChangedDTime = start.AddHours(1), Description = "Different", Level = EAuditTrailLevel.INFORMATION, TrailType = EAuditTrailType.GET });
        await db.SaveChangesAsync();
        var repo = new AuditTrailRespository(db, new HttpContextAccessor { HttpContext = new DefaultHttpContext() });
        var from = DateTimeOffset.Parse("2026-10-13T00:00:00+07:00");
        var before = from.AddDays(1);
        var first = repo.Search(0, 1, "Publish", "WARNING", "POST", from, before);
        Assert.AreEqual(2, first.TotalCount);
        Assert.AreEqual(start.AddDays(1).AddSeconds(-1), first.Data.Single().ChangedDTime);
        Assert.AreEqual(start, repo.Search(1, 1, "Publish", "WARNING", "POST", from, before).Data.Single().ChangedDTime);
        Assert.AreEqual(5, repo.Search(0, 20, "", "", "").TotalCount);
    }
}
