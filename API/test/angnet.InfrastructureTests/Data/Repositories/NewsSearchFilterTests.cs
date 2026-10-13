using System.Security.Claims;
using angnet.Domain.Dtos;
using angnet.Domain.Enums;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Repositories;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using StackExchange.Redis;

namespace angnet.InfrastructureTests.Data.Repositories;

[TestClass]
public class NewsSearchFilterTests
{
    private SqliteConnection connection = null!;
    private AppDbContext db = null!;
    private IHttpContextAccessor context = null!;
    private NewsRespository repo = null!;
    private readonly List<string> cacheFields = [];
    [TestInitialize] public async Task Setup()
    {
        connection = new("Data Source=:memory:"); await connection.OpenAsync();
        db = new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        var httpContext = new DefaultHttpContext();
        context = Mock.Of<IHttpContextAccessor>(c => c.HttpContext == httpContext);
        Login("a", true);
        var redis = new Mock<IConnectionMultiplexer>(); var cache = new Mock<IDatabase>();
        redis.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>())).Returns(cache.Object);
        cache.Setup(c => c.HashGetAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(), It.IsAny<CommandFlags>()))
            .Callback<RedisKey, RedisValue, CommandFlags>((_, key, _) => cacheFields.Add(key.ToString()))
            .ReturnsAsync(RedisValue.Null);
        repo = new(db, context, null!, Mock.Of<IWebHostEnvironment>(), redis.Object);
        db.Users.AddRange(new AppUser { Id = "a", UserName = "author-a", FullName = "An", FlagActive = true },
            new AppUser { Id = "b", UserName = "author-b", FullName = "Bình", FlagActive = true },
            new AppUser { Id = "c", UserName = "private-only", FullName = "Private", FlagActive = true });
        db.NewsCategory.AddRange(new NewsCategoryModel { NewsCategoryId = "root", NewsCategoryName = "Root", FlagActive = true },
            new NewsCategoryModel { NewsCategoryId = "child", NewsCategoryParentId = "root", NewsCategoryName = "Child", FlagActive = true });
        var start = new DateTime(2026, 10, 12, 17, 0, 0, DateTimeKind.Utc); // Oct 13, 00:00 in Vietnam.
        db.News.AddRange(
            Post("1", "a", "Dapper Alpha", start, true, true),
            Post("2", "b", "Dapper Beta", start.AddHours(23).AddMinutes(59), true, true),
            Post("3", "a", "Dapper Gamma", start.AddDays(1), true, true),
            Post("4", "a", "Unrelated title", start.AddHours(1), true, true, description: "Dapper"),
            Post("5", "a", "Dapper Draft", start.AddHours(2), false, false),
            Post("6", "c", "Dapper Private", start.AddHours(3), true, false, EWhoCanSee.Private));
        await db.SaveChangesAsync();
    }
    private static NewsModel Post(string id, string author, string title, DateTime created, bool active, bool pinned,
        EWhoCanSee visibility = EWhoCanSee.Public, string description = "Summary") => new() {
        NewsId = id, Slug = id, UserId = author, CategoryNewsId = "child", ShortTitle = title,
        ShortDescription = description, ContentBody = "Content", CreatedDTime = created,
        UpdatedDTime = created, FlagActive = active, IsPinned = pinned, WhoCanSee = visibility, ViewCount = int.Parse(id)
    };
    private void Login(string? id, bool admin = false) => context.HttpContext!.User = id is null ? new ClaimsPrincipal()
        : new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, id),
            new Claim(ClaimTypes.Role, admin ? "Admin" : "User") }, "test"));
    private async Task<PageInfo<RPNewsDto>> Search(NewsSearchFilterDto? filter = null, string author = "", string sort = "", int page = 0, int size = 20)
        => (PageInfo<RPNewsDto>)(await repo.Search(page, size, "Dapper", author, "root", false, sort: sort, filters: filter)).objResult;
    [TestCleanup] public async Task Cleanup() { await db.DisposeAsync(); await connection.DisposeAsync(); }

    [TestMethod] public async Task FiltersCombineBeforePaging_AndIncludeTheFullLocalDay()
    {
        var filter = new NewsSearchFilterDto { TitleOnly = true, IsPinned = true, Published = true,
            CreatedFrom = DateTimeOffset.Parse("2026-10-13T00:00:00+07:00"), CreatedBefore = DateTimeOffset.Parse("2026-10-14T00:00:00+07:00") };
        var first = await Search(filter, sort: "title", size: 1);
        Assert.AreEqual(2, first.ItemCount); Assert.AreEqual("1", first.DataList.Single().NewsId);
        Assert.AreEqual("2", (await Search(filter, sort: "title", page: 1, size: 1)).DataList.Single().NewsId);
        var own = await Search(filter, "a");
        Assert.AreEqual(1, own.ItemCount); Assert.AreEqual("1", own.DataList.Single().NewsId);
        Assert.IsTrue((await Search()).DataList.Any(n => n.NewsId == "4"), "Public keyword search still includes descriptions");
    }
    [TestMethod] public async Task StatusPinAndSortAreAuthoritative_AndCacheKeysVary()
    {
        Assert.AreEqual("5", (await Search(new() { Published = false, IsPinned = false })).DataList.Single().NewsId);
        var normal = await Search(new() { TitleOnly = true }, sort: "title");
        var reverse = await Search(new() { TitleOnly = true }, sort: "title_desc");
        CollectionAssert.AreEqual(normal.DataList.Select(n => n.NewsId).Reverse().ToArray(), reverse.DataList.Select(n => n.NewsId).ToArray());
        Assert.AreEqual("5", (await Search(new() { TitleOnly = true }, sort: "views")).DataList.First().NewsId);
        await Search(new() { IsPinned = true }); await Search(new() { IsPinned = false });
        Assert.AreEqual(cacheFields.Count, cacheFields.Distinct().Count());
    }
    [TestMethod] public async Task FiltersCannotExposeAnotherAuthorsDraftOrPrivatePost()
    {
        var authors = (await repo.Authors()).DataList;
        CollectionAssert.AreEqual(new[] { "a", "b" }, authors.Select(a => a.UserId).ToArray());
        Login("b");
        Assert.AreEqual(0, (await Search(new() { Published = false }, "a")).ItemCount);
        Assert.AreEqual(0, (await Search(new() { Published = false }, "b")).ItemCount,
            "Title search must not bypass the authenticated author's scope for unpublished posts");
        Assert.IsFalse((await Search()).DataList.Any(n => n.NewsId is "5" or "6"));
        Login(null);
        Assert.AreEqual(0, (await Search(new() { Published = false })).ItemCount);
    }
}
