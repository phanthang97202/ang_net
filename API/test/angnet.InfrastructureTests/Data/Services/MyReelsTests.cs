using System.Security.Claims;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Repositories;
using angnet.Infrastructure.Data.Services;
using angnet.Infrastructure.Data.UnitOfWork;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using angnet.Domain.Dtos;

namespace angnet.InfrastructureTests.Data.Services;

[TestClass]
public class MyReelsTests
{
    [TestMethod]
    public async Task Mine_FiltersOwnerBeforePagingAndExcludesSoftDeletedReels()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        db.Users.AddRange(new AppUser { Id = "me", FullName = "Me", FlagActive = true },
            new AppUser { Id = "other", FullName = "Other", FlagActive = true });
        var now = DateTime.UtcNow;
        for (var i = 0; i < 5; i++)
            db.Reel.Add(new ReelModel { ReelId = $"own-{i}", UserId = "me", FlagActive = true, CreatedDTime = now.AddMinutes(-i) });
        db.Reel.Add(new ReelModel { ReelId = "deleted", UserId = "me", FlagActive = false, CreatedDTime = now });
        db.Reel.Add(new ReelModel { ReelId = "foreign", UserId = "other", FlagActive = true, CreatedDTime = now.AddMinutes(1) });
        db.ReelMedia.Add(new ReelMediaModel { ReelId = "own-0", MediaUrl = "https://example.com/a.mp4", FlagActive = true });
        await db.SaveChangesAsync();
        var repository = new ReelRespository(db, new HttpContextAccessor());
        var uow = new Mock<IUnitOfWork>();
        uow.SetupGet(u => u.ReelRespository).Returns(repository);
        var service = new ReelService(db, new HttpContextAccessor(), uow.Object);
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, "me") }, "test"));
        var first = (CursorPageInfo<ReelDto>)(await service.GetMine(user, 2, null!)).objResult;
        CollectionAssert.AreEqual(new[] { "own-0", "own-1" }, first.DataList.Select(r => r.ReelId).ToArray());
        Assert.IsTrue(first.HasMore);
        Assert.AreEqual(1, first.DataList[0].Media.Count);
        Assert.IsTrue(first.DataList.All(r => r.UserId == "me" && r.IsOwnedByMe));
        var second = (CursorPageInfo<ReelDto>)(await service.GetMine(user, 2, first.NextCursor)).objResult;
        CollectionAssert.AreEqual(new[] { "own-2", "own-3" }, second.DataList.Select(r => r.ReelId).ToArray());
        var last = (CursorPageInfo<ReelDto>)(await service.GetMine(user, 2, second.NextCursor)).objResult;
        CollectionAssert.AreEqual(new[] { "own-4" }, last.DataList.Select(r => r.ReelId).ToArray());
        Assert.IsFalse(last.HasMore);
        Assert.IsNull(last.NextCursor);
        await Assert.ThrowsExceptionAsync<UnauthorizedAccessException>(() => service.GetMine(new ClaimsPrincipal(), 12, null!));
    }
}
