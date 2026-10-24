using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using angnet.Domain.Dtos;

namespace angnet.Infrastructure.Data.Services;

public interface IEzCloudImportService
{
    Task<EzCloudImportResultDto> ImportShiftTransactionsAsync(
        EzCloudImportRequestDto request, CancellationToken cancellationToken = default);
}

public enum EzCloudImportError
{
    InvalidToken,
    RateLimited,
    Unavailable,
    InvalidResponse
}

public sealed class EzCloudImportException(EzCloudImportError error, string message) : Exception(message)
{
    public EzCloudImportError Error { get; } = error;
}

public sealed partial class EzCloudImportService(HttpClient httpClient) : IEzCloudImportService
{
    private const string DailyPaymentPath = "api/statistics/get-daily-payment-list";
    private const int PageSize = 200;
    private const int MaxPages = 50;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<EzCloudImportResultDto> ImportShiftTransactionsAsync(
        EzCloudImportRequestDto request, CancellationToken cancellationToken = default)
    {
        if (request.EndTime <= request.StartTime || request.EndTime - request.StartTime > TimeSpan.FromDays(1))
            throw new ArgumentException("Khoảng thời gian ca phải lớn hơn 0 và không quá 24 giờ.");

        var token = NormalizeToken(request.AccessToken);
        if (token.Length is < 20 or > 16384)
            throw new ArgumentException("Access token ezCloud không hợp lệ.");

        var payments = new List<EzCloudPayment>();
        var totalRecords = int.MaxValue;
        for (var page = 1; page <= MaxPages && payments.Count < totalRecords; page++)
        {
            var response = await GetPageAsync(token, request.StartTime, request.EndTime, page, cancellationToken);
            var data = response.Data ?? throw new EzCloudImportException(EzCloudImportError.InvalidResponse,
                "Dữ liệu ezCloud trả về không đúng định dạng dự kiến.");
            totalRecords = Math.Max(0, data.TotalRecords);
            var pageItems = data.DailyPaymentList;
            payments.AddRange(pageItems);
            if (pageItems.Count == 0 || pageItems.Count < PageSize) break;
        }

        if (payments.Count < totalRecords)
            throw new EzCloudImportException(EzCloudImportError.InvalidResponse,
                "ezCloud trả về quá nhiều giao dịch cho một ca. Hãy thu hẹp khoảng thời gian.");

        return Map(payments);
    }

    private async Task<EzCloudDailyPaymentResponse> GetPageAsync(
        string token, DateTimeOffset start, DateTimeOffset end, int page, CancellationToken cancellationToken)
    {
        var body = new EzCloudDailyPaymentRequest
        {
            StartDate = start.UtcDateTime,
            EndDate = end.UtcDateTime,
            ItemPerPage = PageSize,
            Page = page,
            PageSize = PageSize,
            Skip = (page - 1) * PageSize,
            Take = PageSize
        };
        using var message = new HttpRequestMessage(HttpMethod.Post, DailyPaymentPath)
        {
            Content = JsonContent.Create(body, options: JsonOptions)
        };
        message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        message.Headers.TryAddWithoutValidation("Language", "vi");
        message.Headers.TryAddWithoutValidation("Url", "https://pms.ezcloudhotel.com/#/reports/daily-receipt");

        using var response = await httpClient.SendAsync(message, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
            throw new EzCloudImportException(EzCloudImportError.InvalidToken,
                "Access token ezCloud đã hết hạn hoặc không có quyền đọc báo cáo thanh toán.");
        if (response.StatusCode == HttpStatusCode.TooManyRequests)
            throw new EzCloudImportException(EzCloudImportError.RateLimited,
                "ezCloud đang giới hạn số lần truy cập. Vui lòng thử lại sau.");
        if (!response.IsSuccessStatusCode)
            throw new EzCloudImportException(EzCloudImportError.Unavailable,
                "Không thể kết nối tới ezCloud lúc này.");

        try
        {
            return await response.Content.ReadFromJsonAsync<EzCloudDailyPaymentResponse>(JsonOptions, cancellationToken)
                   ?? throw new JsonException("Empty response");
        }
        catch (JsonException)
        {
            throw new EzCloudImportException(EzCloudImportError.InvalidResponse,
                "Dữ liệu ezCloud trả về không đúng định dạng dự kiến.");
        }
    }

    private static EzCloudImportResultDto Map(List<EzCloudPayment> payments)
    {
        var active = payments.Where(x => !x.IsDeleted).ToList();
        var result = new EzCloudImportResultDto();
        var unknownNonCashMethods = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        var revenueGroups = active
            .Where(x => x.InvoiceGroup == 1 && !IsExpense(x) && !IsPos(x) && Math.Abs(x.Amount) > 0)
            .GroupBy(RevenueKey);
        foreach (var group in revenueGroups)
        {
            var first = group.First();
            var transaction = new TransactionDto
            {
                OrderNumber = result.Transactions.Count + 1,
                RoomNumber = Clean(first.TransactionName ?? first.RoomName, 20),
                InvoiceCode = Clean(first.ReservationNumber ?? first.TransactionNumber, 50),
                CustomerType = ExtractCustomerType(first.TravellerName ?? first.Description),
                IsUseExpenseForReportRevenue = true
            };
            foreach (var payment in group)
            {
                var amount = Math.Abs(payment.Amount);
                if (IsCash(payment.PaymentMethodName))
                    transaction.CashAmount = (transaction.CashAmount ?? 0) + amount;
                else
                {
                    transaction.TransferAmount = (transaction.TransferAmount ?? 0) + amount;
                    if (!IsKnownNonCash(payment.PaymentMethodName))
                        unknownNonCashMethods.Add(Clean(payment.PaymentMethodName, 100));
                }
            }
            result.Transactions.Add(transaction);
        }

        foreach (var expense in active.Where(x => !IsPos(x)
                                                   && (x.InvoiceGroup != 1 || IsExpense(x))
                                                   && Math.Abs(x.Amount) > 0))
        {
            result.Transactions.Add(new TransactionDto
            {
                OrderNumber = result.Transactions.Count + 1,
                ExpenseDescription = Clean(expense.Description ?? expense.Note ?? expense.TransactionName, 2000),
                ExpenseAmount = Math.Abs(expense.Amount),
                IsUseExpenseForReportRevenue = true
            });
        }

        result.Summary = new EzCloudImportSummaryDto
        {
            TransactionCount = result.Transactions.Count,
            SkippedDeletedCount = payments.Count(x => x.IsDeleted),
            TotalCash = result.Transactions.Sum(x => x.CashAmount ?? 0),
            TotalTransfer = result.Transactions.Sum(x => x.TransferAmount ?? 0),
            TotalExpense = result.Transactions.Sum(x => x.ExpenseAmount ?? 0)
        };
        if (unknownNonCashMethods.Count > 0)
            result.Warnings.Add($"Phương thức {string.Join(", ", unknownNonCashMethods)} được đưa vào cột Chuyển khoản.");
        if (result.Summary.SkippedDeletedCount > 0)
            result.Warnings.Add($"Đã bỏ qua {result.Summary.SkippedDeletedCount} giao dịch bị xóa trên ezCloud.");
        return result;
    }

    private static string RevenueKey(EzCloudPayment payment)
    {
        if (payment.ReservationRoomId > 0) return $"room:{payment.ReservationRoomId}";
        var reservation = payment.ReservationNumber ?? payment.TransactionNumber;
        if (!string.IsNullOrWhiteSpace(reservation)) return $"reservation:{reservation.Trim()}";
        return $"payment:{payment.PaymentId}";
    }

    private static bool IsExpense(EzCloudPayment payment) =>
        string.Equals(payment.Module, "EXPENDITURE", StringComparison.OrdinalIgnoreCase);

    private static bool IsPos(EzCloudPayment payment) =>
        string.Equals(payment.Module, "POS", StringComparison.OrdinalIgnoreCase);

    private static bool IsCash(string? paymentMethod)
    {
        var normalized = RemoveDiacritics(paymentMethod).ToLowerInvariant();
        return normalized.Contains("tien mat", StringComparison.Ordinal)
               || normalized.Contains("cash", StringComparison.Ordinal);
    }

    private static bool IsKnownNonCash(string? paymentMethod)
    {
        var normalized = RemoveDiacritics(paymentMethod).ToLowerInvariant();
        return normalized.Contains("chuyen khoan", StringComparison.Ordinal)
               || normalized.Contains("the tin dung", StringComparison.Ordinal)
               || normalized.Contains("credit", StringComparison.Ordinal)
               || normalized.Contains("bank", StringComparison.Ordinal)
               || normalized.Contains("qr", StringComparison.Ordinal);
    }

    private static string ExtractCustomerType(string? value)
    {
        var match = CustomerTypeRegex().Match(value ?? string.Empty);
        return match.Success ? match.Value.ToLowerInvariant().Replace(" ", string.Empty) : string.Empty;
    }

    private static string Clean(string? value, int maxLength)
    {
        var result = (value ?? string.Empty).Trim().TrimStart('#');
        return result.Length <= maxLength ? result : result[..maxLength];
    }

    private static string NormalizeToken(string token)
    {
        token = token.Trim().Trim('"', '\'');
        return token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) ? token[7..].Trim() : token;
    }

    private static string RemoveDiacritics(string? value)
    {
        var normalized = (value ?? string.Empty).Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);
        foreach (var character in normalized)
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
                builder.Append(character);
        return builder.ToString().Normalize(NormalizationForm.FormC);
    }

    [GeneratedRegex(@"k\.\s*(?:ngày|đêm|giờ)(?:\s*/\s*out)?", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex CustomerTypeRegex();

    private sealed class EzCloudDailyPaymentRequest
    {
        public DateTime StartDate { get; init; }
        public DateTime EndDate { get; init; }
        public string[] UserIds { get; init; } = [];
        public int[] PaymentMethodIds { get; init; } = [];
        public string[] Modules { get; init; } = ["FO", "EXPENDITURE"];
        [JsonPropertyName("itemPerPage")] public int ItemPerPage { get; init; }
        public string OrderBy { get; init; } = "PaymentNumber";
        public bool Ascending { get; init; } = true;
        [JsonPropertyName("page")] public int Page { get; init; }
        [JsonPropertyName("pageSize")] public int PageSize { get; init; }
        [JsonPropertyName("skip")] public int Skip { get; init; }
        [JsonPropertyName("take")] public int Take { get; init; }
    }

    private sealed class EzCloudDailyPaymentResponse
    {
        public EzCloudDailyPaymentData? Data { get; init; }
    }

    private sealed class EzCloudDailyPaymentData
    {
        public List<EzCloudPayment> DailyPaymentList { get; init; } = [];
        public int TotalRecords { get; init; }
    }

    private sealed class EzCloudPayment
    {
        public long PaymentId { get; init; }
        public long ReservationRoomId { get; init; }
        public string? ReservationNumber { get; init; }
        public string? TransactionNumber { get; init; }
        public string? TransactionName { get; init; }
        public string? RoomName { get; init; }
        public string? TravellerName { get; init; }
        public string? Description { get; init; }
        public string? Note { get; init; }
        public decimal Amount { get; init; }
        public string? PaymentMethodName { get; init; }
        public int InvoiceGroup { get; init; }
        public string? Module { get; init; }
        public bool IsDeleted { get; init; }
    }
}
