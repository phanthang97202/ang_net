using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Services;
using angnet.WebApi.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using System.Reflection;
using Npgsql;

namespace angnet.InfrastructureTests.Data.Services;

[TestClass]
public class ShiftRentalStatisticsTests
{
    private SqliteConnection connection = null!;
    private AppDbContext db = null!;
    private ShiftReportService service = null!;
    private static DateOnly Day(int day) => new(2026, 10, day);
    private static ShiftRentalStatisticsQuery Query(int first = 1, int last = 3, string? receptionist = null) =>
        new() { FromDate = Day(first), ToDate = Day(last), ReceptionistName = receptionist };

    [TestInitialize]
    public async Task Setup()
    {
        connection = new("Data Source=:memory:"); await connection.OpenAsync();
        db = new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        service = new(db, Mock.Of<IAuditTrailService>());
    }
    [TestCleanup]
    public async Task Cleanup() { await db.DisposeAsync(); await connection.DisposeAsync(); }

    private static ShiftReportModel Report(int date, string shift, string name, params string[] rooms) => new()
    {
        ShiftDate = Day(date), ShiftType = shift, ReceptionistName = name,
        StartTime = new DateTime(2026, 10, date, 12, 0, 0, DateTimeKind.Utc),
        EndTime = new DateTime(2026, 10, date, 12, 0, 0, DateTimeKind.Utc).AddHours(12),
        RoomSales = rooms.Select(room => new ShiftReportRoomSaleModel { RoomNumber = room, RoomCategory = "KHÁCH GIỜ", UnitPrice = 0 }).ToList()
    };

    [TestMethod]
    public async Task CountsSaleRowsOnceAndDoesNotCountPaymentsCheckoutOrDrinks()
    {
        var report = Report(1, "Ca ngày", "Huy", "101", "101", "102", " ");
        report.Transactions.Add(new() { RoomNumber = "101", CustomerType = "k.giờ", InvoiceCode = "A" });
        report.Transactions.Add(new() { RoomNumber = "101", CustomerType = "k.giờ/out", InvoiceCode = "B" });
        report.DrinkSales.Add(new() { ProductCode = "cola", Quantity = 20 });
        db.ShiftReport.AddRange(report, Report(1, "Ca đêm", "Long", "201", "202"));
        await db.SaveChangesAsync();
        var result = await service.GetRentalStatisticsAsync(Query());
        Assert.AreEqual(5, result.Summary.TotalRentals);
        Assert.AreEqual(3, result.Summary.DayRentals);
        Assert.AreEqual(2, result.Summary.NightRentals);
        Assert.AreEqual(2, result.Summary.TotalReports);
        Assert.AreEqual(1, result.Days[0].DayReports); // Several sales never multiply report count.
    }

    [TestMethod]
    public async Task DateBoundsAreInclusiveAndNightBelongsToItsReportDate()
    {
        db.ShiftReport.AddRange(Report(1, "Ca đêm", "Huy", "101"), Report(2, "Ca ngày", "Huy", "102"), Report(3, "Ca ngày", "Huy", "103"));
        await db.SaveChangesAsync();
        var result = await service.GetRentalStatisticsAsync(Query(1, 2));
        Assert.AreEqual(2, result.Days.Count);
        Assert.AreEqual(1, result.Days[0].NightRentals);
        Assert.AreEqual(0, result.Days[1].NightRentals);
        Assert.AreEqual(1, result.Days[1].DayRentals);
        Assert.AreEqual(2, result.Summary.TotalRentals);
    }

    [TestMethod]
    public async Task ReceptionistFilterIsExactAndUsesAllMatchingReportsNotAListPage()
    {
        for (var i = 0; i < 15; i++) db.ShiftReport.Add(Report(1, "Ca ngày", "Huy", "101"));
        db.ShiftReport.AddRange(Report(1, "Ca đêm", "Huy Anh", "102"), Report(3, "Ca ngày", "Lễ tân cũ", "103"));
        await db.SaveChangesAsync();
        var result = await service.GetRentalStatisticsAsync(Query(1, 1, " Huy "));
        Assert.AreEqual(15, result.Summary.TotalRentals);
        Assert.AreEqual(15, result.Summary.TotalReports);
        CollectionAssert.AreEquivalent(new[] { "Huy", "Huy Anh", "Lễ tân cũ" }, result.Receptionists);
    }

    [TestMethod]
    public async Task RetainsZeroSalesMissingDaysAndUnrecognisedShiftTypesSeparately()
    {
        db.ShiftReport.AddRange(Report(1, "Ca ngày", "Huy"), Report(1, "Ca khác", "Long", "101"));
        await db.SaveChangesAsync();
        var result = await service.GetRentalStatisticsAsync(Query());
        Assert.AreEqual(3, result.Days.Count);
        Assert.AreEqual(1, result.Days[0].DayReports);
        Assert.AreEqual(0, result.Days[0].DayRentals);
        Assert.AreEqual(0, result.Days[1].DayReports);
        Assert.AreEqual(1, result.Days[0].OtherRentals);
        Assert.AreEqual(1, result.Summary.TotalRentals);
        Assert.AreEqual(3, result.Summary.IncompleteDays);
    }

    [TestMethod]
    public async Task ShiftCoverageIgnoresReceptionistFilterButCountsStayFiltered()
    {
        db.ShiftReport.AddRange(Report(1, "Ca ngày", "Huy", "101"), Report(1, "Ca đêm", "Chi", "102"), Report(2, "Ca ngày", "Chi"));
        await db.SaveChangesAsync();
        var result = await service.GetRentalStatisticsAsync(Query(1, 2, "Huy"));
        Assert.AreEqual(0, result.Days[0].NightReports);
        Assert.IsTrue(result.Days[0].NightShiftReported); // Worked by Chi, so not missing.
        Assert.IsTrue(result.Days[1].DayShiftReported);
        Assert.IsFalse(result.Days[1].NightShiftReported);
        Assert.AreEqual(1, result.Summary.IncompleteDays);
        Assert.AreEqual(1, result.Summary.TotalReports);
        Assert.AreEqual(1, result.Summary.TotalRentals);
    }

    [TestMethod]
    public async Task TodayAndFutureDaysAreNotCountedAsIncomplete()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
        var result = await service.GetRentalStatisticsAsync(new() { FromDate = today.AddDays(-1), ToDate = today.AddDays(1) });
        Assert.AreEqual(3, result.Days.Count);
        Assert.AreEqual(1, result.Summary.IncompleteDays);
    }

    [TestMethod]
    public async Task EmptyRangeReturnsDatedCoverageWithoutInventingReports()
    {
        var result = await service.GetRentalStatisticsAsync(Query());
        Assert.AreEqual(0, result.Summary.TotalReports);
        Assert.AreEqual(0, result.Summary.TotalRentals);
        Assert.AreEqual(Day(1), result.Days[0].Date);
        Assert.AreEqual(Day(3), result.Days[^1].Date);
    }

    [TestMethod]
    public async Task InvalidRangesReturn400AndStatisticsRequireDedicatedViewPermission()
    {
        var controller = new RentalStatisticsController(service, NullLogger<RentalStatisticsController>.Instance);
        Assert.IsInstanceOfType<BadRequestObjectResult>((await controller.GetRentalStatistics(Query(3, 1), default)).Result);
        Assert.IsInstanceOfType<BadRequestObjectResult>((await controller.GetRentalStatistics(new() { FromDate = Day(1), ToDate = Day(1).AddDays(93) }, default)).Result);
        Assert.IsInstanceOfType<BadRequestObjectResult>((await controller.GetRentalStatistics(new(), default)).Result);
        Assert.AreEqual("rentalstatistics.view", typeof(RentalStatisticsController).GetMethod(nameof(RentalStatisticsController.GetRentalStatistics))!
            .GetCustomAttribute<AuthorizeAttribute>()!.Policy);
        Assert.IsNotNull(typeof(RentalStatisticsController).GetCustomAttribute<AuthorizeAttribute>());
    }

    [TestMethod]
    public async Task Postgres_AggregatesExistingReportsWithZeroSalesAndReceptionistFilter()
    {
        var cs = Environment.GetEnvironmentVariable("ANGNET_RENTAL_TEST_DB");
        if (string.IsNullOrEmpty(cs)) Assert.Inconclusive("Set ANGNET_RENTAL_TEST_DB for isolated PostgreSQL verification.");
        var schema = "rental_test_" + Guid.NewGuid().ToString("N");
        await using var admin = new NpgsqlConnection(cs); await admin.OpenAsync();
        await using (var command = new NpgsqlCommand($"CREATE SCHEMA \"{schema}\"", admin)) await command.ExecuteNonQueryAsync();
        try
        {
            var scoped = new NpgsqlConnectionStringBuilder(cs) { SearchPath = schema }.ConnectionString;
            await using var postgres = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(scoped).Options);
            await postgres.Database.ExecuteSqlRawAsync(postgres.Database.GenerateCreateScript());
            postgres.ShiftReport.AddRange(Report(1, "Ca ngày", "Huy", "101", "101"), Report(1, "Ca đêm", "Long", "102"), Report(2, "Ca ngày", "Huy"));
            await postgres.SaveChangesAsync();
            var actual = new ShiftReportService(postgres, Mock.Of<IAuditTrailService>());
            var all = await actual.GetRentalStatisticsAsync(Query());
            Assert.AreEqual(3, all.Summary.TotalRentals);
            Assert.AreEqual(3, all.Summary.TotalReports);
            Assert.AreEqual(1, all.Days[1].DayReports);
            Assert.AreEqual(0, all.Days[1].DayRentals);
            Assert.AreEqual(2, (await actual.GetRentalStatisticsAsync(Query(receptionist: "Huy"))).Summary.TotalRentals);
        }
        finally
        {
            // Drop only this newly generated test schema, never an existing database.
            await using var command = new NpgsqlCommand($"DROP SCHEMA \"{schema}\" CASCADE", admin); await command.ExecuteNonQueryAsync();
        }
    }
}
