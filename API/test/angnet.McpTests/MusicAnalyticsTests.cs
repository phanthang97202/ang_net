using System.Security.Claims;
using System.Text.Json;
using angnet.Domain.Enums;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.WebApi.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

[TestClass]
public class MusicAnalyticsTests
{
    [TestMethod]
    public async Task RecordsEventsAndAggregatesVietnamDayWhileProtectingPrivateCollections()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        db.Users.Add(new AppUser { Id = "owner", UserName = "owner" });
        db.MusicCollection.Add(new MusicCollectionModel { CollectionId = "private", OwnerId = "owner", Name = "Secret", Visibility = EArchiveVisibility.Private });
        await db.SaveChangesAsync();
        var controller = new MusicAnalyticsController(db, TimeProvider.System) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        controller.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "user")], "test"));
        Assert.IsInstanceOfType(await controller.Track(new MusicEventRequest { Kind = "click", Provider = "YouTube", TrackId = "abc", Title = "Song", CollectionId = "private" }, default), typeof(NoContentResult));
        Assert.AreEqual("", (await db.MusicAnalyticsEvent.SingleAsync()).CollectionId);
        Assert.AreEqual("user", (await db.MusicAnalyticsEvent.SingleAsync()).UserId);
        Assert.IsInstanceOfType(await controller.Track(new MusicEventRequest { Kind = "search", Provider = "YouTube", Keyword = "nhạc" }, default), typeof(NoContentResult));
        Assert.IsInstanceOfType(await controller.Track(new MusicEventRequest { Kind = "click", Provider = "Other", TrackId = "x" }, default), typeof(BadRequestResult));
        var today = DateTime.UtcNow.AddHours(7).ToString("yyyy-MM-dd");
        var result = (OkObjectResult)await controller.Report(today, today, ct: default);
        var json = JsonSerializer.SerializeToElement(result.Value);
        var data = json.GetProperty("Data");
        Assert.AreEqual(1, data.GetProperty("Users").GetInt32());
        Assert.AreEqual(2, data.GetProperty("Recent").GetArrayLength());
        Assert.AreEqual(0, data.GetProperty("Collections").GetArrayLength());
        Assert.IsTrue(data.GetProperty("Counts").EnumerateArray().Any(x => x.GetProperty("Kind").GetString() == "click" && x.GetProperty("Count").GetInt32() == 1));
        Assert.IsInstanceOfType(await controller.Report(today, today, collectionId: "private"), typeof(BadRequestResult));
        Assert.IsInstanceOfType(await controller.Report("bad-date", today), typeof(BadRequestResult));
    }

    [TestMethod]
    public void ReportRequiresTheDedicatedPermission()
    {
        var attribute = typeof(MusicAnalyticsController).GetMethod(nameof(MusicAnalyticsController.Report))!
            .GetCustomAttributes(typeof(AuthorizeAttribute), true).Cast<AuthorizeAttribute>().Single();
        Assert.AreEqual("music.analytics.view", attribute.Policy);
    }
}
