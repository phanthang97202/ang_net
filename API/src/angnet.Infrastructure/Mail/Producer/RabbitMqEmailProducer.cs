using angnet.Infrastructure.Mail.Service;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using RabbitMQ.Client;
using System.Text;
using System.Threading.Tasks;

namespace angnet.Infrastructure.Mail.Producer
{
    public class RabbitMqEmailProducer
    {
        private readonly IConfiguration _configuration;

        public RabbitMqEmailProducer(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task Publish(EmailMessageModel emailMessage)
        {
            try
            {
                var rbmq = _configuration.GetSection("CloudAMQP");

                string conStr = rbmq["AMQPConnectionString"] ?? "";

                var factory = new ConnectionFactory
                {
                    Uri = new Uri(conStr)
                };

                //Queue Lưu trữ messages Hộp thư
                //ExchangeĐịnh tuyến messagesBưu điện phân loại
                //BindingRule định tuyến
                //Địa chỉ trên thư
                //ConsumerXử lý messagesNgười nhận thư

                // Sử dụng API mới của RabbitMQ.Client v7+
                using var connection = await factory.CreateConnectionAsync();
                using var channel = await connection.CreateChannelAsync();

                // Khai báo queue
                // Type => Default exchange (1 queue duy nhất)
                await channel.QueueDeclareAsync(
                    queue: "send_email",
                    durable: true,
                    exclusive: false,
                    autoDelete: false,
                    arguments: null
                );

                // Serialize và publish message
                var json = JsonConvert.SerializeObject(emailMessage);
                var body = Encoding.UTF8.GetBytes(json);

                // Tạo BasicProperties với cách mới
                var properties = new BasicProperties
                {
                    Persistent = true // Message sẽ được lưu trữ persistent
                };

                await channel.BasicPublishAsync(
                    exchange: "",
                    routingKey: "send_email",
                    mandatory: false,
                    basicProperties: properties,
                    body: body
                );
            }
            catch
            {
                throw;
            }

        }
    }
} 