using System.Text;
using System.Text.Json;
using angnet.Domain.Dtos;
using angnet.Infrastructure.Data.Services;

namespace angnet.InfrastructureTests.Data.Services;

// Chạy tay để đối chiếu với ezCloud thật; không có token thì bỏ qua (Inconclusive).
// Chỉ in số đếm và mốc giờ - không in tên khách, số phòng hay số tiền.
//   set EZCLOUD_PROBE_TOKEN=...
//   set EZCLOUD_PROBE_START=2026-10-23T07:00:00+07:00   (tùy chọn, mặc định ca ngày hôm qua)
//   set EZCLOUD_PROBE_END=2026-10-23T19:00:00+07:00
//   dotnet test --filter LiveEzCloudProbeTests --logger "console;verbosity=detailed"
[TestClass]
public class LiveEzCloudProbeTests
{
    [TestMethod]
    public async Task Probe_RealResponseMapsWithoutReadingCustomerData()
    {
        var token = Environment.GetEnvironmentVariable("EZCLOUD_PROBE_TOKEN");
        if (string.IsNullOrWhiteSpace(token))
            Assert.Inconclusive("Set EZCLOUD_PROBE_TOKEN to probe the real ezCloud API.");

        var vietnam = TimeSpan.FromHours(7);
        var yesterday = DateTimeOffset.UtcNow.ToOffset(vietnam).Date.AddDays(-1);
        var start = ReadTime("EZCLOUD_PROBE_START") ?? new DateTimeOffset(yesterday.AddHours(7), vietnam);
        var end = ReadTime("EZCLOUD_PROBE_END") ?? start.AddHours(12);

        var capture = new CaptureHandler();
        var service = new EzCloudImportService(new HttpClient(capture)
        {
            BaseAddress = new Uri("https://pms.ezcloudhotel.com/"),
            Timeout = TimeSpan.FromSeconds(30)
        });
        var result = await service.ImportShiftTransactionsAsync(new EzCloudImportRequestDto
        {
            AccessToken = token!,
            StartTime = start,
            EndTime = end
        });

        var rows = capture.Bodies.SelectMany(body => FindRows(JsonDocument.Parse(body).RootElement)).ToList();
        Console.WriteLine($"Shift {start:O} -> {end:O}; pages={capture.Bodies.Count}; rawRows={rows.Count}");
        // Kiểm tra giả định: số âm = tiền ra, InvoiceGroup 1 = phiếu thu.
        foreach (var group in rows.GroupBy(row =>
                     $"Module={Text(row, "Module")} InvoiceGroup={Text(row, "InvoiceGroup")} " +
                     $"Amount{(Amount(row) < 0 ? "<0" : ">0")} Deleted={Text(row, "IsDeleted")}").OrderBy(x => x.Key))
            Console.WriteLine($"  {group.Key}: {group.Count()}");
        // Kiểm tra múi giờ: mốc sớm/muộn nhất của mỗi trường thời gian phải nằm trong ca.
        foreach (var times in rows.SelectMany(row => row.EnumerateObject())
                     .Where(p => p.Value.ValueKind == JsonValueKind.String && p.Value.GetString()!.Contains('T')
                                 && DateTime.TryParse(p.Value.GetString(), out _))
                     .GroupBy(p => p.Name))
        {
            var values = times.Select(p => p.Value.GetString()!).Order().ToList();
            Console.WriteLine($"  {times.Key}: {values[0]} .. {values[^1]}");
        }
        Console.WriteLine($"MappedRows={result.Transactions.Count}; Warnings={result.Warnings.Count}");
    }

    private static DateTimeOffset? ReadTime(string name) =>
        DateTimeOffset.TryParse(Environment.GetEnvironmentVariable(name), out var value) ? value : null;

    private static IEnumerable<JsonElement> FindRows(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object) yield break;
        foreach (var property in element.EnumerateObject())
        {
            if (property.Name.Equals("DailyPaymentList", StringComparison.OrdinalIgnoreCase)
                && property.Value.ValueKind == JsonValueKind.Array)
                foreach (var row in property.Value.EnumerateArray()) yield return row.Clone();
            else
                foreach (var row in FindRows(property.Value)) yield return row;
        }
    }

    private static string Text(JsonElement row, string name) =>
        row.EnumerateObject().FirstOrDefault(p => p.Name.Equals(name, StringComparison.OrdinalIgnoreCase)).Value.ToString();

    private static decimal Amount(JsonElement row) =>
        decimal.TryParse(Text(row, "Amount"), System.Globalization.NumberStyles.Number,
            System.Globalization.CultureInfo.InvariantCulture, out var amount) ? amount : 0;

    private sealed class CaptureHandler() : DelegatingHandler(new HttpClientHandler())
    {
        public List<string> Bodies { get; } = [];

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var response = await base.SendAsync(request, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            Bodies.Add(body);
            response.Content = new StringContent(body, Encoding.UTF8, "application/json");
            return response;
        }
    }
}
