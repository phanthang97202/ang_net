using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.Infrastructure.Mail.Service;
using angnet.Utility.CommonUtils;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;

namespace angnet.Infrastructure.Mail.Consumer
{
    public class RabbitMqEmailConsumer : BackgroundService
    {
        private readonly EmailSenderService _emailSenderService;
        //private readonly IAuditTrailService _auditTrailService;
        private readonly WriteLog _logger;
        private readonly IConfiguration _config;
        private IConnection? _connection;
        private IChannel? _channel;

        public RabbitMqEmailConsumer(
            EmailSenderService emailSenderService,
            //IAuditTrailService auditTrailService,
            WriteLog logger,
            IConfiguration config)
        {
            _emailSenderService = emailSenderService;
            //_auditTrailService = auditTrailService;
            _logger = logger;
            _config = config;
        }

        private async Task InitializeRabbitMQAsync()
        {
            try
            {
                var factory = new ConnectionFactory
                {
                    Uri = new Uri(_config.GetSection("CloudAMQP")["AMQPConnectionString"] ?? "")
                };

                _connection = await factory.CreateConnectionAsync();
                _channel = await _connection.CreateChannelAsync();

                await _channel.QueueDeclareAsync(
                    queue: "send_email",
                    durable: true,
                    exclusive: false,
                    autoDelete: false,
                    arguments: null
                );

                // đảm bảo không nhận quá nhiều message một lúc
                await _channel.BasicQosAsync(0, 1, false);

                _logger.LogInformation("RabbitMQ connection established successfully");
            }
            catch (Exception ex)
            {
                await LogAuditAsync("InitRabbitMQ", $"Init error: {ex.Message}");
                _logger.LogError("Failed to initialize RabbitMQ connection: " + ex.Message);
                throw;
            }
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await InitializeRabbitMQAsync();

            if (_channel == null)
            {
                _logger.LogError("RabbitMQ channel is null. Consumer not started.");
                return;
            }

            var consumer = new AsyncEventingBasicConsumer(_channel);

            consumer.ReceivedAsync += async (ch, ea) =>
            {
                EmailMessageModel? message = null;

                try
                {
                    var body = ea.Body.ToArray();
                    var json = Encoding.UTF8.GetString(body);
                    message = JsonConvert.DeserializeObject<EmailMessageModel>(json);

                    if (message == null)
                    {
                        await _channel.BasicNackAsync(ea.DeliveryTag, false, false);
                        return;
                    }

                    await _emailSenderService.SendEmailAsync(message);
                    await _channel.BasicAckAsync(ea.DeliveryTag, false);

                    _logger.LogInformation($"Email sent successfully to {message.To}");

                    await LogAuditAsync(message.Id, $"{message.Subject}\n{message.Body}");
                }
                catch (Exception ex)
                {
                    // nack để message quay lại queue (có thể retry)
                    await _channel!.BasicNackAsync(ea.DeliveryTag, false, true);

                    await LogAuditAsync(message?.Id ?? Guid.NewGuid().ToString(),
                        $"Error sending mail: {ex.Message}");

                    _logger.LogError($"Error processing email: {ex.Message}");
                }
            };

            // Bắt đầu consume
            await _channel.BasicConsumeAsync("send_email", autoAck: false, consumer: consumer);

            _logger.LogInformation("RabbitMQ email consumer started.");
            await Task.CompletedTask; // giữ service chạy
        }

        private async Task LogAuditAsync(string recordId, string description)
        {
            try
            {
                //await _auditTrailService.Create(new AuditTrailDto
                //{
                //    RecordId = recordId,
                //    Description = description,
                //    ChangedColumns = "",
                //    OldValues = ""
                //});
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"Audit log failed: {ex.Message}");
            }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Email consumer is stopping...");

            if (_channel != null)
            {
                await _channel.CloseAsync();
                _channel.Dispose();
            }

            if (_connection != null)
            {
                await _connection.CloseAsync();
                _connection.Dispose();
            }

            await base.StopAsync(cancellationToken);
        }

        public override void Dispose()
        {
            _channel?.Dispose();
            _connection?.Dispose();
            base.Dispose();
        }
    }
}
