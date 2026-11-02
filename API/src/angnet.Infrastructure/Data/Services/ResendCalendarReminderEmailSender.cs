using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace angnet.Infrastructure.Data.Services;

public sealed class ResendCalendarReminderEmailSender(
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration) : ICalendarReminderEmailSender
{
    public async Task<string> SendAsync(
        CalendarReminderEmail email,
        string idempotencyKey,
        CancellationToken cancellationToken)
    {
        var apiKey = configuration["Resend:ApiKey"]?.Trim();
        var fromEmail = configuration["Resend:FromEmail"]?.Trim();
        if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(fromEmail))
        {
            throw new CalendarReminderConfigurationException(
                "Missing Resend:ApiKey or Resend:FromEmail configuration.");
        }

        var (subject, html, text) = BuildContent(email);
        using var request = new HttpRequestMessage(HttpMethod.Post, "emails")
        {
            Content = JsonContent.Create(new
            {
                from = fromEmail,
                to = new[] { email.RecipientEmail },
                subject,
                html,
                text
            })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Headers.TryAddWithoutValidation("Idempotency-Key", idempotencyKey);

        using var response = await httpClientFactory.CreateClient("Resend")
            .SendAsync(request, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var compactError = responseBody.Length <= 600 ? responseBody : responseBody[..600];
            throw new HttpRequestException(
                $"Resend returned HTTP {(int)response.StatusCode}: {compactError}",
                null,
                response.StatusCode);
        }

        using var document = JsonDocument.Parse(responseBody);
        if (!document.RootElement.TryGetProperty("id", out var id) || string.IsNullOrWhiteSpace(id.GetString()))
        {
            throw new HttpRequestException("Resend returned a successful response without an email id.");
        }

        return id.GetString()!;
    }

    private static (string Subject, string Html, string Text) BuildContent(CalendarReminderEmail email)
    {
        var count = email.Items.Count;
        var date = email.ReminderDate.ToString("dd/MM/yyyy");
        var subject = $"[Phan Thang Blog] {count} lịch cần làm hôm nay - {date}";
        var name = Encode(string.IsNullOrWhiteSpace(email.RecipientName) ? "bạn" : email.RecipientName);
        var calendarUrl = Encode(email.CalendarUrl);

        var rows = new StringBuilder();
        var plainRows = new StringBuilder();
        foreach (var item in email.Items)
        {
            var time = item.AllDay
                ? "Cả ngày"
                : $"{item.StartTime} – {item.EndTime}";
            var dateRange = item.StartDate == item.EndDate
                ? item.StartDate.ToString("dd/MM/yyyy")
                : $"{item.StartDate:dd/MM/yyyy} – {item.EndDate:dd/MM/yyyy}";
            var location = string.IsNullOrWhiteSpace(item.Location)
                ? string.Empty
                : $"<div style=\"margin-top:6px;color:#66657a;font-size:13px\">📍 {Encode(item.Location)}</div>";
            var notes = string.IsNullOrWhiteSpace(item.Notes)
                ? string.Empty
                : $"<div style=\"margin-top:6px;color:#77758a;font-size:13px;line-height:1.5\">{Encode(item.Notes)}</div>";

            rows.Append($$"""
                <div style="margin:0 0 12px;padding:16px 18px;border:1px solid #eceaf8;border-radius:14px;background:#ffffff">
                  <div style="font-size:16px;font-weight:700;color:#18172a">{{Encode(item.Title)}}</div>
                  <div style="margin-top:7px;color:#5b50e6;font-size:13px;font-weight:600">{{Encode(time)}} · {{Encode(dateRange)}}</div>
                  {{location}}{{notes}}
                </div>
                """);

            plainRows.Append("- ").Append(item.Title).Append(" — ").Append(time)
                .Append(" — ").Append(dateRange);
            if (!string.IsNullOrWhiteSpace(item.Location)) plainRows.Append(" — ").Append(item.Location);
            plainRows.AppendLine();
        }

        var html = $$"""
            <!doctype html>
            <html lang="vi">
            <body style="margin:0;padding:0;background:#f7f6fc;font-family:Arial,Helvetica,sans-serif;color:#18172a">
              <div style="max-width:640px;margin:0 auto;padding:28px 16px">
                <div style="overflow:hidden;border:1px solid #ebe9f5;border-radius:22px;background:#ffffff;box-shadow:0 12px 36px rgba(48,40,110,.08)">
                  <div style="padding:28px;background:linear-gradient(135deg,#5b4cf0,#8175ff);color:#ffffff">
                    <div style="font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;opacity:.82">Phan Thang Blog</div>
                    <h1 style="margin:10px 0 6px;font-size:25px;line-height:1.25">Lịch cần làm hôm nay</h1>
                    <div style="font-size:14px;opacity:.88">{{date}} · {{count}} công việc</div>
                  </div>
                  <div style="padding:26px">
                    <p style="margin:0 0 18px;font-size:15px;line-height:1.6">Xin chào <strong>{{name}}</strong>, đây là các mục trong lịch cá nhân của bạn hôm nay.</p>
                    {{rows}}
                    <div style="padding-top:8px;text-align:center">
                      <a href="{{calendarUrl}}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#5b4cf0;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px">Mở lịch cá nhân</a>
                    </div>
                  </div>
                </div>
                <p style="margin:16px 0 0;text-align:center;color:#9996aa;font-size:12px">Daily personal calendar reminder · Phan Thang Blog</p>
              </div>
            </body>
            </html>
            """;

        var text = $"Xin chào {email.RecipientName},\n\nLịch cần làm hôm nay ({date}):\n{plainRows}\nMở lịch: {email.CalendarUrl}";
        return (subject, html, text);
    }

    private static string Encode(string value) => WebUtility.HtmlEncode(value);
}
