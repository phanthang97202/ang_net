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
        var subject = $"Lịch hôm nay: {count} việc cần làm · {date}";
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
                ? string.Empty
                : $"<div style=\"margin-top:5px;color:#77758a;font-size:12px;line-height:1.45\">{item.StartDate:dd/MM/yyyy} – {item.EndDate:dd/MM/yyyy}</div>";
            var location = string.IsNullOrWhiteSpace(item.Location)
                ? string.Empty
                : $"<div style=\"margin-top:8px;color:#66657a;font-size:13px;line-height:1.45\"><span style=\"color:#9895a8\">Địa điểm:</span> {Encode(item.Location)}</div>";
            var notes = string.IsNullOrWhiteSpace(item.Notes)
                ? string.Empty
                : $"<div style=\"margin-top:7px;color:#77758a;font-size:13px;line-height:1.5\">{Encode(item.Notes)}</div>";

            rows.Append($$"""
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 12px;border:1px solid #e9e7f1;border-radius:14px;background:#ffffff;border-collapse:separate">
                  <tr>
                    <td class="event-time" width="116" valign="top" style="padding:17px 14px;background:#f4f1ff;border-radius:13px 0 0 13px;text-align:center">
                      <div style="color:#5b4cf0;font-size:13px;font-weight:700;line-height:1.45">{{Encode(time)}}</div>
                      {{dateRange}}
                    </td>
                    <td class="event-detail" valign="top" style="padding:17px 18px">
                      <div style="font-size:15px;font-weight:700;line-height:1.45;color:#1d1b2e">{{Encode(item.Title)}}</div>
                      {{location}}{{notes}}
                    </td>
                  </tr>
                </table>
                """);

            plainRows.Append("- ").Append(item.Title).Append(" — ").Append(time)
                .Append(" — ").Append(dateRange);
            if (!string.IsNullOrWhiteSpace(item.Location)) plainRows.Append(" — ").Append(item.Location);
            plainRows.AppendLine();
        }

        var html = $$"""
            <!doctype html>
            <html lang="vi">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width,initial-scale=1">
              <style>
                @media only screen and (max-width:600px) {
                  .email-shell { padding:16px 10px !important; }
                  .email-header, .email-content { padding-left:20px !important; padding-right:20px !important; }
                  .event-time { width:92px !important; padding-left:8px !important; padding-right:8px !important; }
                  .event-detail { padding-left:14px !important; padding-right:14px !important; }
                }
              </style>
            </head>
            <body style="margin:0;padding:0;background:#f6f5fa;font-family:Arial,Helvetica,sans-serif;color:#1d1b2e">
              <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">Bạn có {{count}} việc cần làm trong lịch cá nhân hôm nay.</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f6f5fa">
                <tr>
                  <td class="email-shell" align="center" style="padding:32px 16px">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;border:1px solid #e8e6ef;border-radius:20px;background:#ffffff;border-collapse:separate;overflow:hidden;box-shadow:0 10px 30px rgba(38,31,84,.06)">
                      <tr>
                        <td style="height:5px;background:#5b4cf0;background-image:linear-gradient(90deg,#5040e8,#8c7cff);font-size:0;line-height:0">&nbsp;</td>
                      </tr>
                      <tr>
                        <td style="padding:20px 28px;border-bottom:1px solid #eeecf3">
                          <div style="font-size:14px;font-weight:700;letter-spacing:.02em;color:#312d48">Phan <span style="color:#5b4cf0">Thang</span> Blog</div>
                        </td>
                      </tr>
                      <tr>
                        <td class="email-header" style="padding:28px;background:#f6f3ff;background-image:linear-gradient(135deg,#faf8ff,#f0edff)">
                          <div style="display:inline-block;margin-bottom:12px;padding:6px 10px;border-radius:999px;background:#ffffff;color:#5b4cf0;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase">Nhắc lịch hôm nay</div>
                          <h1 style="margin:0;color:#1d1b2e;font-size:26px;line-height:1.25;letter-spacing:-.02em">Bạn có {{count}} việc cần làm</h1>
                          <div style="margin-top:9px;color:#77738a;font-size:14px;line-height:1.5">{{date}} · Tổng hợp từ lịch cá nhân</div>
                        </td>
                      </tr>
                      <tr>
                        <td class="email-content" style="padding:26px 28px 30px">
                          <p style="margin:0 0 20px;color:#4f4b60;font-size:14px;line-height:1.65">Chào <strong style="color:#1d1b2e">{{name}}</strong>, dưới đây là những việc bạn đã lên lịch cho hôm nay.</p>
                          {{rows}}
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:22px">
                            <tr>
                              <td align="center">
                                <a href="{{calendarUrl}}" style="display:inline-block;padding:12px 20px;border-radius:12px;background:#5b4cf0;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;line-height:1">Xem lịch cá nhân</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:16px 0 0;color:#9995a7;font-size:11px;line-height:1.5;text-align:center">Email nhắc lịch tự động từ Phan Thang Blog</p>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;

        var text = $"Xin chào {email.RecipientName},\n\nLịch cần làm hôm nay ({date}):\n{plainRows}\nMở lịch: {email.CalendarUrl}";
        return (subject, html, text);
    }

    private static string Encode(string value) => WebUtility.HtmlEncode(value);
}
