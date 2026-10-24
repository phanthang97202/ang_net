using System.Net;
using System.Text;
using System.Text.Json;
using angnet.Domain.Dtos;
using angnet.Infrastructure.Data.Services;

namespace angnet.InfrastructureTests.Data.Services;

[TestClass]
public class EzCloudImportServiceTests
{
    [TestMethod]
    public async Task Import_MapsAndGroupsPaymentsWithoutPersistingTheToken()
    {
        var handler = new StubHandler(HttpStatusCode.OK, """
        {
          "data": {
            "TotalRecords": 5,
            "DailyPaymentList": [
              { "PaymentId": 1, "ReservationRoomId": 88, "ReservationNumber": "#203", "TransactionName": "202", "TravellerName": "k.ngày (expedia) - Guest", "Amount": 300000, "PaymentMethodName": "Tiền mặt", "InvoiceGroup": 1, "Module": "FO", "IsDeleted": false },
              { "PaymentId": 2, "ReservationRoomId": 88, "ReservationNumber": "#203", "TransactionName": "202", "TravellerName": "k.ngày (expedia) - Guest", "Amount": 700000, "PaymentMethodName": "Thẻ tín dụng", "InvoiceGroup": 1, "Module": "FO", "IsDeleted": false },
              { "PaymentId": 3, "Description": "Mua vật tư", "Amount": -50000, "PaymentMethodName": "Tiền mặt", "InvoiceGroup": 0, "Module": "EXPENDITURE", "IsDeleted": false },
              { "PaymentId": 4, "ReservationRoomId": 99, "ReservationNumber": "#204", "TransactionName": "301", "Amount": 900000, "PaymentMethodName": "Tiền mặt", "InvoiceGroup": 1, "Module": "FO", "IsDeleted": true },
              { "PaymentId": 5, "TransactionNumber": "P01", "TransactionName": "Cafe", "Amount": 20000, "PaymentMethodName": "Tiền mặt", "InvoiceGroup": 1, "Module": "POS", "IsDeleted": false }
            ]
          }
        }
        """);
        var client = new HttpClient(handler) { BaseAddress = new Uri("https://pms.ezcloudhotel.com/") };
        var service = new EzCloudImportService(client);

        var result = await service.ImportShiftTransactionsAsync(new EzCloudImportRequestDto
        {
            AccessToken = "Bearer test-access-token-with-safe-length",
            StartTime = new DateTimeOffset(2026, 10, 24, 7, 0, 0, TimeSpan.FromHours(7)),
            EndTime = new DateTimeOffset(2026, 10, 24, 19, 0, 0, TimeSpan.FromHours(7))
        });

        Assert.AreEqual("Bearer test-access-token-with-safe-length", handler.Authorization);
        Assert.AreEqual("api/statistics/get-daily-payment-list", handler.RequestUri);
        StringAssert.Contains(handler.Body, "\"Modules\":[\"FO\",\"EXPENDITURE\"]");
        Assert.IsFalse(handler.Body.Contains("test-access-token", StringComparison.Ordinal));
        Assert.AreEqual(2, result.Transactions.Count);
        var room = result.Transactions[0];
        Assert.AreEqual("202", room.RoomNumber);
        Assert.AreEqual("203", room.InvoiceCode);
        Assert.AreEqual("k.ngày", room.CustomerType);
        Assert.AreEqual(300000m, room.CashAmount);
        Assert.AreEqual(700000m, room.TransferAmount);
        Assert.AreEqual("Mua vật tư", result.Transactions[1].ExpenseDescription);
        Assert.AreEqual(50000m, result.Transactions[1].ExpenseAmount);
        Assert.AreEqual(1, result.Summary.SkippedDeletedCount);
    }

    [TestMethod]
    public async Task Import_MapsUpstreamUnauthorizedToInvalidToken()
    {
        var service = new EzCloudImportService(new HttpClient(new StubHandler(HttpStatusCode.Unauthorized, "{}"))
        {
            BaseAddress = new Uri("https://pms.ezcloudhotel.com/")
        });

        var exception = await Assert.ThrowsExceptionAsync<EzCloudImportException>(() =>
            service.ImportShiftTransactionsAsync(new EzCloudImportRequestDto
            {
                AccessToken = "expired-access-token-with-safe-length",
                StartTime = DateTimeOffset.UtcNow,
                EndTime = DateTimeOffset.UtcNow.AddHours(12)
            }));

        Assert.AreEqual(EzCloudImportError.InvalidToken, exception.Error);
    }

    [TestMethod]
    public async Task Import_UnwrapsNestedResultData()
    {
        var service = new EzCloudImportService(new HttpClient(new StubHandler(HttpStatusCode.OK, """
        {
          "result": {
            "data": {
              "TotalRecords": "1",
              "DailyPaymentList": [
                { "PaymentId": 11, "ReservationRoomId": 12, "ReservationNumber": 205, "TransactionNumber": 205, "TransactionName": "303", "Description": "k.đêm - Guest", "Amount": 450000, "PaymentMethodName": "Cash", "InvoiceGroup": 1, "Module": "FO", "IsDeleted": false }
              ]
            }
          }
        }
        """))
        {
            BaseAddress = new Uri("https://pms.ezcloudhotel.com/")
        });

        var result = await service.ImportShiftTransactionsAsync(new EzCloudImportRequestDto
        {
            AccessToken = "nested-response-token-with-safe-length",
            StartTime = DateTimeOffset.UtcNow,
            EndTime = DateTimeOffset.UtcNow.AddHours(12)
        });

        Assert.AreEqual(1, result.Transactions.Count);
        Assert.AreEqual("303", result.Transactions[0].RoomNumber);
        Assert.AreEqual("205", result.Transactions[0].InvoiceCode);
        Assert.AreEqual(450000m, result.Transactions[0].CashAmount);
    }

    [TestMethod]
    public async Task Import_MapsSuccessfulAuthErrorEnvelopeToInvalidToken()
    {
        var service = new EzCloudImportService(new HttpClient(new StubHandler(HttpStatusCode.OK,
            "{\"statusCode\":401,\"message\":\"Access token expired\"}"))
        {
            BaseAddress = new Uri("https://pms.ezcloudhotel.com/")
        });

        var exception = await Assert.ThrowsExceptionAsync<EzCloudImportException>(() =>
            service.ImportShiftTransactionsAsync(new EzCloudImportRequestDto
            {
                AccessToken = "expired-envelope-token-with-safe-length",
                StartTime = DateTimeOffset.UtcNow,
                EndTime = DateTimeOffset.UtcNow.AddHours(12)
            }));

        Assert.AreEqual(EzCloudImportError.InvalidToken, exception.Error);
    }

    private sealed class StubHandler(HttpStatusCode status, string responseBody) : HttpMessageHandler
    {
        public string Authorization { get; private set; } = string.Empty;
        public string RequestUri { get; private set; } = string.Empty;
        public string Body { get; private set; } = string.Empty;

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Authorization = request.Headers.Authorization?.ToString() ?? string.Empty;
            RequestUri = request.RequestUri?.AbsolutePath.TrimStart('/') ?? string.Empty;
            Body = request.Content is null ? string.Empty : await request.Content.ReadAsStringAsync(cancellationToken);
            return new HttpResponseMessage(status)
            {
                Content = new StringContent(responseBody, Encoding.UTF8, "application/json")
            };
        }
    }
}
