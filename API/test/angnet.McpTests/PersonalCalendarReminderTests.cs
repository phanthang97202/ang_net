using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.Domain.Enums;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Services;
using angnet.WebApi.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

[TestClass]
public class PersonalCalendarReminderTests
{
    [TestMethod]
    public async Task SendsTodaysActiveItemsOnlyOnce()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = CreateDb(connection);
        await db.Database.EnsureCreatedAsync();
        SeedSettings(db);
        db.Users.Add(new AppUser
        {
            Id = "alice", UserName = "alice", FullName = "Alice", Email = "alice@example.com",
            FlagActive = true
        });
        db.PersonalCalendarEvent.AddRange(
            Event("todo", "alice", "Gửi báo cáo", new DateOnly(2026, 11, 2), "todo", "09:00"),
            Event("done", "alice", "Việc đã xong", new DateOnly(2026, 11, 2), "done", "08:30"),
            new PersonalCalendarEventModel
            {
                EventId = "weekly", OwnerId = "alice", Title = "Tập thể dục",
                StartDate = new DateOnly(2026, 10, 26), EndDate = new DateOnly(2026, 10, 26),
                StartTime = "06:30", EndTime = "07:00", Category = "routine", Status = "urgent",
                RepeatDays = 1 << (int)DayOfWeek.Monday, Version = 1
            });
        await db.SaveChangesAsync();

        var sender = new RecordingSender();
        var service = CreateService(db, sender, new DateTimeOffset(2026, 11, 2, 1, 30, 0, TimeSpan.Zero));

        var first = await service.RunAsync(default);
        var second = await service.RunAsync(default);

        Assert.AreEqual("completed", first.State);
        Assert.AreEqual(1, first.Sent);
        Assert.AreEqual(2, sender.Messages.Single().Items.Count);
        CollectionAssert.AreEqual(
            new[] { "Tập thể dục", "Gửi báo cáo" },
            sender.Messages.Single().Items.Select(x => x.Title).ToArray());
        Assert.AreEqual(0, second.Sent);
        Assert.AreEqual(1, second.AlreadyProcessed);
        Assert.AreEqual(PersonalCalendarReminderDeliveryModel.SentStatus,
            (await db.PersonalCalendarReminderDelivery.AsNoTracking().SingleAsync()).Status);
    }

    [TestMethod]
    public async Task DoesNotSendBeforeConfiguredVietnamTime()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = CreateDb(connection);
        await db.Database.EnsureCreatedAsync();
        SeedSettings(db);
        db.Users.Add(new AppUser
        {
            Id = "alice", UserName = "alice", Email = "alice@example.com", FlagActive = true
        });
        db.PersonalCalendarEvent.Add(
            Event("todo", "alice", "Gửi báo cáo", new DateOnly(2026, 11, 2), "todo", "09:00"));
        await db.SaveChangesAsync();
        var sender = new RecordingSender();

        var result = await CreateService(db, sender,
            new DateTimeOffset(2026, 11, 2, 0, 30, 0, TimeSpan.Zero)).RunAsync(default);

        Assert.AreEqual("not_due", result.State);
        Assert.AreEqual(0, sender.Messages.Count);
        Assert.AreEqual(0, await db.PersonalCalendarReminderDelivery.CountAsync());
    }

    [TestMethod]
    public async Task FailedDeliveryCanRetryWithoutDuplicatingSuccessfulDelivery()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = CreateDb(connection);
        await db.Database.EnsureCreatedAsync();
        SeedSettings(db);
        db.Users.Add(new AppUser
        {
            Id = "alice", UserName = "alice", Email = "alice@example.com", FlagActive = true
        });
        db.PersonalCalendarEvent.Add(
            Event("todo", "alice", "Gửi báo cáo", new DateOnly(2026, 11, 2), "todo", "09:00"));
        await db.SaveChangesAsync();
        var sender = new RecordingSender { FailNext = true };
        var service = CreateService(db, sender, new DateTimeOffset(2026, 11, 2, 1, 30, 0, TimeSpan.Zero));

        var failed = await service.RunAsync(default);
        var retried = await service.RunAsync(default);
        var final = await service.RunAsync(default);

        Assert.AreEqual(1, failed.Failed);
        Assert.AreEqual(1, retried.Sent);
        Assert.AreEqual(1, final.AlreadyProcessed);
        var delivery = await db.PersonalCalendarReminderDelivery.AsNoTracking().SingleAsync();
        Assert.AreEqual(2, delivery.AttemptCount);
        Assert.AreEqual(PersonalCalendarReminderDeliveryModel.SentStatus, delivery.Status);
    }

    [TestMethod]
    public async Task TriggerRequiresSecretAndSupportsFreeUptimeRobotCall()
    {
        var service = new StubReminderService();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["CalendarReminder:TriggerSecret"] = "a-long-random-secret"
            }).Build();
        var controller = new CalendarReminderTriggerController(
            service, new RecordingAuditTrailService(), configuration,
            NullLogger<CalendarReminderTriggerController>.Instance);

        Assert.IsInstanceOfType(await controller.Run(null, default), typeof(UnauthorizedObjectResult));
        Assert.IsInstanceOfType(await controller.Run("wrong", default), typeof(UnauthorizedObjectResult));
        Assert.IsInstanceOfType(await controller.Run("a-long-random-secret", default), typeof(OkObjectResult));
        Assert.IsInstanceOfType(await controller.Ping(null, default), typeof(UnauthorizedObjectResult));
        Assert.IsInstanceOfType(await controller.Ping("wrong", default), typeof(UnauthorizedObjectResult));
        Assert.IsInstanceOfType(await controller.Ping("a-long-random-secret", default), typeof(OkObjectResult));
        Assert.AreEqual(2, service.Calls);
        Assert.IsNotNull(typeof(CalendarReminderTriggerController)
            .GetCustomAttributes(typeof(AllowAnonymousAttribute), true).SingleOrDefault());

        var pingMethod = typeof(CalendarReminderTriggerController)
            .GetMethod(nameof(CalendarReminderTriggerController.Ping));
        Assert.IsNotNull(pingMethod);
        Assert.AreEqual(1, pingMethod.GetCustomAttributes(typeof(HttpHeadAttribute), true).Length);
        Assert.AreEqual(1, pingMethod.GetCustomAttributes(typeof(HttpGetAttribute), true).Length);
    }

    [TestMethod]
    public async Task TriggerWritesSystemAuditForDeliveryAndFailure()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["CalendarReminder:TriggerSecret"] = "a-long-random-secret"
            }).Build();
        var audit = new RecordingAuditTrailService();
        var successfulController = new CalendarReminderTriggerController(
            new StubReminderService(new CalendarReminderRunResult(
                "completed", new DateOnly(2026, 11, 2), "08:00", 1, 1, 0, 0, 0)),
            audit, configuration, NullLogger<CalendarReminderTriggerController>.Instance);
        var failedController = new CalendarReminderTriggerController(
            new StubReminderService(new CalendarReminderRunResult(
                "partially_failed", new DateOnly(2026, 11, 2), "08:00", 1, 0, 0, 0, 1)),
            audit, configuration, NullLogger<CalendarReminderTriggerController>.Instance);

        Assert.IsInstanceOfType(
            await successfulController.Ping("a-long-random-secret", default),
            typeof(OkObjectResult));
        Assert.IsInstanceOfType(
            await failedController.Ping("a-long-random-secret", default),
            typeof(ObjectResult));

        Assert.AreEqual(2, audit.Entries.Count);
        Assert.AreEqual(EAuditTrailLevel.INFORMATION, audit.Entries[0].Level);
        Assert.AreEqual(EAuditTrailLevel.ERROR, audit.Entries[1].Level);
        Assert.IsTrue(audit.Entries.All(x => x.ChangedBy == "Hệ thống"));
        Assert.IsTrue(audit.Entries.All(x => x.RecordId == "calendar-reminder-20261102"));
    }

    private static AppDbContext CreateDb(SqliteConnection connection) =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);

    private static PersonalCalendarReminderService CreateService(
        AppDbContext db,
        ICalendarReminderEmailSender sender,
        DateTimeOffset now) => new(
        db,
        sender,
        new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["CalendarReminder:CalendarUrl"] = "https://phanthang.site/calendar"
        }).Build(),
        new FixedTimeProvider(now),
        NullLogger<PersonalCalendarReminderService>.Instance);

    private static PersonalCalendarEventModel Event(
        string id,
        string owner,
        string title,
        DateOnly date,
        string status,
        string startTime) => new()
    {
        EventId = id,
        OwnerId = owner,
        Title = title,
        StartDate = date,
        EndDate = date,
        StartTime = startTime,
        EndTime = "10:00",
        Category = "work",
        Status = status,
        Version = 1
    };

    private static void SeedSettings(AppDbContext db)
    {
        db.SysParameter.AddRange(
            Parameter(PersonalCalendarReminderService.EnabledParameter, "true"),
            Parameter(PersonalCalendarReminderService.TimeParameter, "08:00"));
    }

    private static SysParameterModel Parameter(string code, string value) => new()
    {
        ParameterCode = code,
        ParameterNameVi = code,
        ParameterNameEn = code,
        ParameterValueVi = value,
        ParameterValueEn = value,
        DefaultValueVi = value,
        DefaultValueEn = value,
        DataType = "string",
        Category = "Calendar",
        FlagActive = true
    };

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    private sealed class RecordingSender : ICalendarReminderEmailSender
    {
        public List<CalendarReminderEmail> Messages { get; } = [];
        public bool FailNext { get; set; }

        public Task<string> SendAsync(
            CalendarReminderEmail email,
            string idempotencyKey,
            CancellationToken cancellationToken)
        {
            if (FailNext)
            {
                FailNext = false;
                throw new HttpRequestException("Temporary provider error");
            }
            Messages.Add(email);
            return Task.FromResult("email-id");
        }
    }

    private sealed class StubReminderService(
        CalendarReminderRunResult? result = null) : IPersonalCalendarReminderService
    {
        public int Calls { get; private set; }

        public Task<CalendarReminderRunResult> RunAsync(CancellationToken cancellationToken)
        {
            Calls++;
            return Task.FromResult(result ?? new CalendarReminderRunResult(
                "completed", new DateOnly(2026, 11, 2), "08:00", 0, 0, 0, 0, 0));
        }
    }

    private sealed class RecordingAuditTrailService : IAuditTrailService
    {
        public List<AuditTrailDto> Entries { get; } = [];

        public Task<ApiResponse<AuditTrailDto>> Create(AuditTrailDto data)
        {
            Entries.Add(data);
            return Task.FromResult(new ApiResponse<AuditTrailDto>(data));
        }

        public Task<ApiResponse<AuditTrailModel>> GetAllActive() =>
            throw new NotSupportedException();

        public ApiResponse<AuditTrailModel> Search(
            int pageIndex,
            int pageSize,
            string keyword,
            string level,
            string trailType,
            DateTimeOffset? changedFrom = null,
            DateTimeOffset? changedBefore = null) => throw new NotSupportedException();
    }
}
