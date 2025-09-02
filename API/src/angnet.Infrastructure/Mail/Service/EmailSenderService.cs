using DocumentFormat.OpenXml.VariantTypes;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;

//  🎯 Điểm khác nhau
//  Vai trò	                    Producer (RabbitMqEmailProducer)	                                Consumer (RabbitMqEmailConsumer)
//  Nhiệm vụ	        Serialize EmailMessageModel và gửi message vào queue.	        Lấy message từ queue, deserialize, rồi gọi EmailSenderService.SendEmailAsync.
//  Hành động chính	    BasicPublishAsync (gửi message)	                                BasicConsume hoặc BasicGet (nhận message)
//  Thời gian chạy	    Chỉ chạy khi bạn gọi Publish(email)	                            Chạy nền liên tục (BackgroundService) để xử lý message đến.
//  Logic xử lý	        Không quan tâm email có gửi được không.	                        Có retry, log lỗi, gọi SMTP, ghi AuditTrail…

//  📌 Tại sao lại có code lặp?
//      Vì cả hai đều là client của RabbitMQ, nên việc kết nối, tạo channel, khai báo queue là bắt buộc và giống nhau.
//  Sự khác biệt chỉ ở:
//      Producer = push message vào queue.
//      Consumer = nhận message từ queue và xử lý.

namespace angnet.Infrastructure.Mail.Service
{
    public class EmailSenderService
    {
        private readonly IConfiguration _configuration;
        public EmailSenderService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(EmailMessageModel  emailMessage)
        {
            try
            {
                if (_configuration == null)
                {
                    throw new Exception("Cant get app configuration!!!");
                }

                var smtpSection = _configuration.GetSection("SMTP");

                string hostname = smtpSection["Host"] ?? "";
                string port = smtpSection["Port"] ?? "";
                string username = smtpSection["UserName"] ?? "";
                string password = smtpSection["Password"] ?? "";
                string enableSsl = smtpSection["EnableSsl"] ?? "";

                if (
                    string.IsNullOrWhiteSpace(hostname) 
                    || string.IsNullOrWhiteSpace(port)
                    || string.IsNullOrWhiteSpace(username)
                    || string.IsNullOrWhiteSpace(password)
                    || string.IsNullOrWhiteSpace(enableSsl)
                ) {
                    string msg = string.Format(@"Please check again app configuration {0} {1} {2} {3} {4}", hostname, port, username, password, enableSsl);
                    throw new Exception(msg);
                }

                using var client = new SmtpClient(hostname, int.Parse(port))
                {
                    Credentials = new NetworkCredential(username, password),
                    EnableSsl = Convert.ToBoolean(enableSsl)
                };

                var mail = new MailMessage(
                    username,
                    emailMessage.To,
                    emailMessage.Subject,
                    emailMessage.Body
                )
                {
                    IsBodyHtml = true
                };

                await client.SendMailAsync(mail);

            }
            catch (Exception ex)
            {
                throw;
            }
        }
    }
}
