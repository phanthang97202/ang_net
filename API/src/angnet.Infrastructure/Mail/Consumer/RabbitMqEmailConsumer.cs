using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Mail.Service;
using angnet.Utility.CommonUtils;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
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
        private readonly IServiceScopeFactory _scopeFactory;
        private IConnection? _connection;
        private IChannel? _channel;
        private const int MaxAttempts = 3;

        public RabbitMqEmailConsumer(
            EmailSenderService emailSenderService,
            //IAuditTrailService auditTrailService,
            WriteLog logger,
            IConfiguration config,
            IServiceScopeFactory scopeFactory)
        {
            _emailSenderService = emailSenderService;
            //_auditTrailService = auditTrailService;
            _logger = logger;
            _config = config;
            _scopeFactory = scopeFactory;
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

                // Channel giống như "làn đường" trên một "con đường chính"(Connection):
                // Connection = Con đường chính từ nhà bạn đến RabbitMQ(tốn kém setup)
                // Channel = Các làn đường trên con đường đó(rẻ, setup nhanh)
                // Nhiều xe(messages) có thể đi song song trên các làn khác nhau
                // Nếu 1 làn bị kẹt / hỏng, các làn khác vẫn hoạt động bình thường
                // Mục đích: Tối ưu hóa hiệu năng và tài nguyên network khi làm việc với message broker!
                _channel = await _connection.CreateChannelAsync(); // tiết kiệm tài nguyên khi dùng channel

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
            try
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
                        await TryUpdateDeliveryAsync(
                            message.DeliveryId,
                            EmailDeliveryModel.SucceededStatus,
                            message.AttemptCount + 1,
                            null,
                            DateTime.UtcNow);
                        await _channel.BasicAckAsync(ea.DeliveryTag, false);

                        _logger.LogInformation($"Email sent successfully to {message.To}");

                        await LogAuditAsync(message.Id, $"{message.Subject}\n{message.Body}");
                    }
                    catch (Exception ex)
                    {
                        // Mail bài viết thử lại tối đa ba lần; các loại mail cũ vẫn requeue như trước.
                        if (message?.DeliveryId is not null)
                        {
                            int attemptCount = message.AttemptCount + 1;
                            bool exhausted = attemptCount >= MaxAttempts;

                            await TryUpdateDeliveryAsync(
                                message.DeliveryId,
                                exhausted
                                    ? EmailDeliveryModel.FailedStatus
                                    : EmailDeliveryModel.PendingStatus,
                                attemptCount,
                                ex.Message,
                                null);

                            if (exhausted)
                            {
                                await _channel!.BasicAckAsync(ea.DeliveryTag, false);
                            }
                            else
                            {
                                message.AttemptCount = attemptCount;
                                await RepublishAsync(message);
                                await _channel!.BasicAckAsync(ea.DeliveryTag, false);
                            }
                        }
                        else
                        {
                            await _channel!.BasicNackAsync(ea.DeliveryTag, false, true);
                        }

                        await LogAuditAsync(message?.Id ?? Guid.NewGuid().ToString(),
                            $"Error sending mail: {ex.Message}");

                        _logger.LogError($"Error processing email: {ex.Message}");
                    }
                };

                // Bắt đầu consume
                await _channel.BasicConsumeAsync("send_email", autoAck: false, consumer: consumer);

                _logger.LogInformation("RabbitMQ email consumer started.");

                // ======
                //await Task.CompletedTask; // giữ service chạy

                // ======
                // Tạo TaskCompletionSource để giữ service chạy
                var tcs = new TaskCompletionSource<bool>();
                stoppingToken.Register(() => tcs.SetResult(true));

                // Chờ cho đến khi cancellation token được trigger
                await tcs.Task;

            }
            catch
            {
                throw;
            }
        }

        private async Task RepublishAsync(EmailMessageModel message)
        {
            string json = JsonConvert.SerializeObject(message);
            byte[] body = Encoding.UTF8.GetBytes(json);
            BasicProperties properties = new BasicProperties { Persistent = true };

            await _channel!.BasicPublishAsync(
                exchange: "",
                routingKey: "send_email",
                mandatory: false,
                basicProperties: properties,
                body: body);
        }

        private async Task TryUpdateDeliveryAsync(
            string? deliveryId,
            string status,
            int attemptCount,
            string? lastError,
            DateTime? sentAt)
        {
            if (string.IsNullOrWhiteSpace(deliveryId))
            {
                return;
            }

            try
            {
                using IServiceScope scope = _scopeFactory.CreateScope();
                AppDbContext dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                EmailDeliveryModel? delivery =
                    await dbContext.EmailDelivery.FindAsync(deliveryId);

                if (delivery is null)
                {
                    return;
                }

                delivery.Status = status;
                delivery.AttemptCount = attemptCount;
                delivery.LastError = lastError?.Length > 2000
                    ? lastError[..2000]
                    : lastError;
                delivery.SentAt = sentAt;
                delivery.UpdatedDTime = DateTime.UtcNow;
                await dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    $"Could not update email delivery {deliveryId}: {ex.Message}");
            }
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
