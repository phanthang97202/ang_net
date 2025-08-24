using DocumentFormat.OpenXml.VariantTypes;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;

namespace angnet.Infrastructure.Mail.Service
{
    public class EmailSenderService
    {
        private readonly IConfiguration _configuration;
        public EmailSenderService(IConfiguration configuration)
        {
            _configuration = configuration;
            //// Tự nạp file cấu hình
            //var config = new ConfigurationBuilder()
            //    .SetBasePath(Directory.GetCurrentDirectory()) // EF sẽ dùng thư mục WebApi làm working dir
            //    .AddJsonFile("appsettings.json", optional: false)
            //    .Build();

            //// Lấy chuỗi kết nối
            //var connectionString = config.GetConnectionString("PostgresqlDb");
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
                throw new Exception(ex.Message);
            }
        }
    }
}
