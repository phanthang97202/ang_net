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

internal sealed class EzCloudFlexibleStringConverter : JsonConverter<string?>
{
    public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String) return reader.GetString();
        if (reader.TokenType == JsonTokenType.Null) return null;
        if (reader.TokenType == JsonTokenType.Number)
        {
            using var document = JsonDocument.ParseValue(ref reader);
            return document.RootElement.GetRawText();
        }
        throw new JsonException($"Cannot convert {reader.TokenType} to a string.");
    }

    public override void Write(Utf8JsonWriter writer, string? value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value);
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
        var seenPaymentIds = new HashSet<long>();
        var complete = false;
        for (var page = 1; page <= MaxPages && !complete; page++)
        {
            var data = await GetPageAsync(token, request.StartTime, request.EndTime, page, cancellationToken);
            // PaymentId chặn trùng khi ezCloud bỏ qua tham số phân trang và trả lại cùng dữ liệu.
            var added = data.DailyPaymentList.Where(x => x.PaymentId <= 0 || seenPaymentIds.Add(x.PaymentId)).ToList();
            payments.AddRange(added);
            // Thiếu TotalRecords thì chỉ dừng khi trang chưa đầy, không coi trang đầu là đủ.
            complete = data.DailyPaymentList.Count < PageSize || added.Count == 0
                       || (data.TotalRecords > 0 && payments.Count >= data.TotalRecords);
        }

        if (!complete)
            throw new EzCloudImportException(EzCloudImportError.InvalidResponse,
                "ezCloud trả về quá nhiều giao dịch cho một ca. Hãy thu hẹp khoảng thời gian.");

        return Map(payments);
    }

    private async Task<EzCloudDailyPaymentData> GetPageAsync(
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
            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            if (TryFindPaymentData(document.RootElement, 0, out var data)) return data;

            if (LooksLikeAuthenticationError(document.RootElement))
                throw new EzCloudImportException(EzCloudImportError.InvalidToken,
                    "Access token ezCloud đã hết hạn hoặc không có quyền đọc báo cáo thanh toán.");

            throw new EzCloudImportException(EzCloudImportError.InvalidResponse,
                "Dữ liệu ezCloud trả về không đúng định dạng dự kiến.");
        }
        catch (JsonException)
        {
            throw new EzCloudImportException(EzCloudImportError.InvalidResponse,
                "Dữ liệu ezCloud trả về không đúng định dạng dự kiến.");
        }
    }

    private static bool TryFindPaymentData(
        JsonElement element, int depth, out EzCloudDailyPaymentData data)
    {
        data = new EzCloudDailyPaymentData();
        if (depth > 4 || element.ValueKind != JsonValueKind.Object) return false;

        if (TryGetProperty(element, "DailyPaymentList", out var listElement)
            && listElement.ValueKind is JsonValueKind.Array or JsonValueKind.Null)
        {
            data = new EzCloudDailyPaymentData
            {
                DailyPaymentList = listElement.ValueKind == JsonValueKind.Array
                    ? listElement.Deserialize<List<EzCloudPayment>>(JsonOptions) ?? []
                    : [],
                TotalRecords = TryGetProperty(element, "TotalRecords", out var totalElement)
                    ? ReadInt(totalElement)
                    : 0
            };
            return true;
        }

        foreach (var property in element.EnumerateObject())
        {
            if (property.Value.ValueKind == JsonValueKind.Object
                && TryFindPaymentData(property.Value, depth + 1, out data))
                return true;
        }
        return false;
    }

    private static bool LooksLikeAuthenticationError(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object) return false;
        foreach (var property in element.EnumerateObject())
        {
            if (property.Name.Equals("status", StringComparison.OrdinalIgnoreCase)
                || property.Name.Equals("statusCode", StringComparison.OrdinalIgnoreCase)
                || property.Name.Equals("code", StringComparison.OrdinalIgnoreCase))
            {
                var status = ReadInt(property.Value);
                if (status is 401 or 403) return true;
            }

            if (property.Name.Contains("message", StringComparison.OrdinalIgnoreCase)
                || property.Name.Contains("error", StringComparison.OrdinalIgnoreCase))
            {
                var message = property.Value.ToString();
                if (message.Contains("token", StringComparison.OrdinalIgnoreCase)
                    || message.Contains("auth", StringComparison.OrdinalIgnoreCase)
                    || message.Contains("login", StringComparison.OrdinalIgnoreCase))
                    return true;
            }

            if (property.Value.ValueKind == JsonValueKind.Object
                && LooksLikeAuthenticationError(property.Value))
                return true;
        }
        return false;
    }

    private static bool TryGetProperty(JsonElement element, string name, out JsonElement value)
    {
        foreach (var property in element.EnumerateObject())
        {
            if (!property.Name.Equals(name, StringComparison.OrdinalIgnoreCase)) continue;
            value = property.Value;
            return true;
        }
        value = default;
        return false;
    }

    private static int ReadInt(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out var number)) return number;
        return element.ValueKind == JsonValueKind.String
               && int.TryParse(element.GetString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out number)
            ? number
            : 0;
    }

    private static EzCloudImportResultDto Map(List<EzCloudPayment> payments)
    {
        var active = payments.Where(x => !x.IsDeleted && !IsPos(x) && x.Amount != 0).ToList();
        var result = new EzCloudImportResultDto();
        var unknownNonCashMethods = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var refunds = new List<EzCloudTransactionDto>();
        var refundCount = 0;

        foreach (var group in active.Where(IsIncome).GroupBy(RevenueKey))
        {
            var first = group.First();
            // Cộng theo dấu: khoản hoàn (số âm) trừ vào chính dòng của phòng đó.
            decimal cash = 0, transfer = 0;
            foreach (var payment in group)
            {
                if (payment.Amount < 0) refundCount++;
                if (IsCash(payment.PaymentMethodName))
                    cash += payment.Amount;
                else
                {
                    transfer += payment.Amount;
                    if (!IsKnownNonCash(payment.PaymentMethodName))
                        unknownNonCashMethods.Add(Clean(payment.PaymentMethodName, 100));
                }
            }

            var roomNumber = Clean(first.TransactionName ?? first.RoomName, 20);
            var invoiceCode = Clean(first.ReservationNumber ?? first.TransactionNumber, 50);
            if (cash > 0 || transfer > 0)
                result.Transactions.Add(new EzCloudTransactionDto
                {
                    PaymentTime = EarliestPaymentTime(group.Where(x => x.Amount > 0)),
                    RoomNumber = roomNumber,
                    InvoiceCode = invoiceCode,
                    CustomerType = ExtractCustomerType(first.TravellerName ?? first.Description),
                    CashAmount = cash > 0 ? cash : null,
                    TransferAmount = transfer > 0 ? transfer : null,
                    // Phiếu thu khác (module thu chi) không có phòng: giữ lý do thu để lễ tân đối chiếu.
                    PrepaidNote = IsExpense(first) ? Clean(first.Description ?? first.Note, 200) : string.Empty,
                    IsUseExpenseForReportRevenue = true
                });

            // Form báo cáo không nhận số âm: phần hoàn vượt số đã thu trong ca (vd cọc
            // thu từ ca trước) ghi thành khoản chi để tiền bàn giao vẫn đúng.
            var refunded = Math.Max(0, -cash) + Math.Max(0, -transfer);
            if (refunded > 0)
                refunds.Add(new EzCloudTransactionDto
                {
                    PaymentTime = EarliestPaymentTime(group.Where(x => x.Amount < 0)),
                    ExpenseDescription = Clean($"Hoàn tiền {(roomNumber.Length > 0 ? roomNumber : invoiceCode)}", 500),
                    ExpenseAmount = refunded,
                    IsUseExpenseForReportRevenue = true
                });
        }

        result.Transactions.AddRange(refunds);
        foreach (var expense in active.Where(x => !IsIncome(x)))
        {
            result.Transactions.Add(new EzCloudTransactionDto
            {
                PaymentTime = EarliestPaymentTime([expense]),
                ExpenseDescription = Clean(expense.Description ?? expense.Note ?? expense.TransactionName, 500),
                ExpenseAmount = Math.Abs(expense.Amount),
                IsUseExpenseForReportRevenue = true
            });
        }
        for (var i = 0; i < result.Transactions.Count; i++)
            result.Transactions[i].OrderNumber = i + 1;

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
        if (refundCount > 0)
            result.Warnings.Add($"Có {refundCount} khoản hoàn tiền/giảm trừ: đã trừ vào dòng của phòng tương ứng, "
                                + "phần vượt số đã thu trong ca được ghi thành khoản chi. Hãy kiểm tra lại.");
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

    // Tên trường giờ lập phiếu của ezCloud chưa được xác nhận bằng dữ liệu thật (xem
    // LiveEzCloudProbeTests): chỉ nhận các tên chỉ giờ thu/lập phiếu, không bao giờ lấy
    // giờ check-in/check-out vì dễ bị hiểu nhầm là giờ thu tiền. Không khớp thì để trống.
    private static readonly string[] PaymentTimeFields =
    [
        "PaymentDate", "PaymentTime", "PaymentDateTime",
        "CreatedDate", "CreatedTime", "CreatedDateTime", "CreateDate", "CreatedOn", "CreatedAt"
    ];

    private static string? EarliestPaymentTime(IEnumerable<EzCloudPayment> payments) =>
        payments.Select(ReadPaymentTime).OfType<string>().Order(StringComparer.Ordinal).FirstOrDefault();

    private static string? ReadPaymentTime(EzCloudPayment payment)
    {
        if (payment.Extra is null) return null;
        foreach (var name in PaymentTimeFields)
            foreach (var (key, value) in payment.Extra)
                if (key.Equals(name, StringComparison.OrdinalIgnoreCase) && value.ValueKind == JsonValueKind.String
                    && IsoTimeRegex().IsMatch(value.GetString()!))
                    return value.GetString();
        return null;
    }

    [GeneratedRegex(@"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}")]
    private static partial Regex IsoTimeRegex();

    // Khoản thu: phiếu thu lễ tân (kể cả khoản hoàn số âm của phiếu đó), hoặc phiếu
    // thu khác số dương trong module thu chi. Còn lại là khoản chi.
    private static bool IsIncome(EzCloudPayment payment) =>
        payment.InvoiceGroup == 1 && (!IsExpense(payment) || payment.Amount > 0);

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

    private sealed class EzCloudDailyPaymentData
    {
        public List<EzCloudPayment> DailyPaymentList { get; init; } = [];
        public int TotalRecords { get; init; }
    }

    private sealed class EzCloudPayment
    {
        public long PaymentId { get; init; }
        public long ReservationRoomId { get; init; }
        [JsonConverter(typeof(EzCloudFlexibleStringConverter))]
        public string? ReservationNumber { get; init; }
        [JsonConverter(typeof(EzCloudFlexibleStringConverter))]
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
        [JsonExtensionData] public Dictionary<string, JsonElement>? Extra { get; init; }
    }
}
