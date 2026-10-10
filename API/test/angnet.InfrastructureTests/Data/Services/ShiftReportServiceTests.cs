using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace angnet.InfrastructureTests.Data.Services;

[TestClass]
public class ShiftReportServiceTests
{
    [TestMethod]
    public async Task CreateUpdateRead_SeparatesPaymentsAndPersistsNotes()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        db.SysParameter.Add(new SysParameterModel {
            ParameterCode = "SHIFT_DRINK_STOCK",
            ParameterValueVi = """[{"code":"cola","name":"Coca Cola","unit":"lon","price":20000,"stockIn":100}]"""
        });
        await db.SaveChangesAsync();
        var audit = new Mock<IAuditTrailService>();
        audit.Setup(x => x.Create(It.IsAny<AuditTrailDto>())).ReturnsAsync(new ApiResponse<AuditTrailDto>());
        var service = new ShiftReportService(db, audit.Object);
        var dto = new CreateShiftReportDto {
            ShiftDate = new DateOnly(2026, 10, 10), ShiftType = "Ca ngày",
            StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(12),
            ReceptionistName = "Huy", ReceiverName = "Thắng", HandoverNote = "Kiểm tra két tiền\nĐủ tiền",
            Transactions = [new() { OrderNumber = 1, CashAmount = 3000000, TransferAmount = 500000, ExpenseAmount = 100000 }],
            DrinkSales = [
                new() { ProductCode = "cola", ProductName = "Coca Cola", Unit = "lon", Quantity = 10, UnitPrice = 20000, PaymentMethod = "Tiền mặt" },
                new() { ProductCode = "cola", ProductName = "Coca Cola", Unit = "lon", Quantity = 4, UnitPrice = 20000, PaymentMethod = "Chuyển khoản" }
            ]
        };
        var created = await service.CreateAsync(dto);
        Assert.AreEqual(3000000m, created.TotalCash);
        Assert.AreEqual(500000m, created.TotalTransfer);
        Assert.AreEqual(3100000m, created.HandoverAmount);
        db.ChangeTracker.Clear();
        var read = await service.GetByIdAsync(created.Id);
        Assert.AreEqual(dto.HandoverNote, read.HandoverNote);
        var update = new UpdateShiftReportDto {
            Id = created.Id, ShiftDate = dto.ShiftDate, ShiftType = dto.ShiftType,
            StartTime = dto.StartTime, EndTime = dto.EndTime,
            ReceptionistName = dto.ReceptionistName, ReceiverName = dto.ReceiverName,
            HandoverNote = "", Transactions = dto.Transactions, DrinkSales = dto.DrinkSales
        };
        update.DrinkSales[0].PaymentMethod = "Chuyển khoản";
        await service.UpdateAsync(update);
        db.ChangeTracker.Clear();
        read = await service.GetByIdAsync(created.Id);
        Assert.AreEqual("", read.HandoverNote);
        Assert.AreEqual(3000000m, read.TotalCash);
        Assert.AreEqual(500000m, read.TotalTransfer);
        Assert.AreEqual(2900000m, read.HandoverAmount);
        var list = await service.GetAllAsync(new ShiftReportQueryParams());
        Assert.AreEqual(3000000m, list.Items.Single().TotalCash);
        Assert.AreEqual(500000m, list.Items.Single().TotalTransfer);
        Assert.AreEqual(2900000m, list.Items.Single().HandoverAmount);
    }

    [TestMethod]
    public async Task Migration_RecalculatesHistoricalTotalsFromDetailsAndDefaultsNotes()
    {
        // The migration uses portable SQL; validate its data changes in an isolated
        // SQLite database without connecting to the deployed PostgreSQL database.
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = """
            CREATE TABLE "ShiftReport" (id INTEGER PRIMARY KEY, "TotalCash" NUMERIC, "TotalTransfer" NUMERIC, "TotalExpense" NUMERIC, "HandoverAmount" NUMERIC);
            CREATE TABLE "ShiftReportTransaction" ("ShiftReportId" INTEGER, "CashAmount" NUMERIC, "TransferAmount" NUMERIC, "ExpenseAmount" NUMERIC);
            CREATE TABLE "ShiftReportDrinkSale" ("ShiftReportId" INTEGER, "Quantity" INTEGER, "UnitPrice" NUMERIC, "PaymentMethod" TEXT);
            INSERT INTO "ShiftReport" VALUES (1, 3200000, 580000, 100000, 3100000), (2, 99, 99, 99, 99), (3, 0, 0, 0, 0);
            INSERT INTO "ShiftReportTransaction" VALUES (1, 2000000, 300000, NULL), (1, 1000000, 200000, 100000);
            INSERT INTO "ShiftReportDrinkSale" VALUES (1, 10, 20000, 'Tiền mặt'), (1, 4, 20000, 'Chuyển khoản'), (3, 2, 25000, 'Tiền mặt');
            """;
        await command.ExecuteNonQueryAsync();
        var assembly = typeof(AppDbContext).Assembly;
        var resource = assembly.GetManifestResourceNames().Single(name => name.EndsWith("0048_GhiChuVaTongTienBaoCaoCa.sql"));
        using var script = new StreamReader(assembly.GetManifestResourceStream(resource)!);
        command.CommandText = await script.ReadToEndAsync();
        await command.ExecuteNonQueryAsync();
        command.CommandText = """SELECT "TotalCash", "TotalTransfer", "TotalExpense", "HandoverAmount", "HandoverNote" FROM "ShiftReport" ORDER BY id""";
        await using var reader = await command.ExecuteReaderAsync();
        Assert.IsTrue(await reader.ReadAsync());
        Assert.AreEqual(3000000m, reader.GetDecimal(0));
        Assert.AreEqual(500000m, reader.GetDecimal(1));
        Assert.AreEqual(100000m, reader.GetDecimal(2));
        Assert.AreEqual(3100000m, reader.GetDecimal(3));
        Assert.AreEqual("", reader.GetString(4));
        Assert.IsTrue(await reader.ReadAsync());
        for (var i = 0; i < 4; i++) Assert.AreEqual(0m, reader.GetDecimal(i));
        Assert.IsTrue(await reader.ReadAsync());
        Assert.AreEqual(0m, reader.GetDecimal(0));
        Assert.AreEqual(50000m, reader.GetDecimal(3));
    }
}
