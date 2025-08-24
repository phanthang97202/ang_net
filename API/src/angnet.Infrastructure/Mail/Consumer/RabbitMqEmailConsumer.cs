using angnet.Infrastructure.Mail.Service;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace angnet.Infrastructure.Mail.Consumer
{
    public class RabbitMqEmailConsumer : BackgroundService
    {
        private readonly EmailSenderService _emailSenderService;
        private readonly IConfiguration _config;
        private readonly ILogger<RabbitMqEmailConsumer> _logger;
        private IConnection _connection;
        private IChannel _channel;

        public RabbitMqEmailConsumer(
            EmailSenderService emailSenderService,
            IConfiguration config,
            ILogger<RabbitMqEmailConsumer> logger)
        {
            _emailSenderService = emailSenderService;
            _config = config;
            _logger = logger;

            InitializeRabbitMQ();
        }

        private async void InitializeRabbitMQ()
        {
            try
            {
                var factory = new ConnectionFactory
                {
                    Uri = new Uri(_config.GetConnectionString("RabbitMQ"))
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

                _logger.LogInformation("RabbitMQ connection established successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize RabbitMQ connection");
                throw;
            }
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            try
            {
                // Cách khác cho RabbitMQ.Client v7
                await _channel.BasicQosAsync(prefetchSize: 0, prefetchCount: 1, global: false);

                while (!stoppingToken.IsCancellationRequested)
                {
                    try
                    {
                        var result = await _channel.BasicGetAsync(queue: "send_email", autoAck: false);

                        if (result != null)
                        {
                            var body = result.Body.ToArray();
                            var json = Encoding.UTF8.GetString(body);
                            var message = JsonConvert.DeserializeObject<EmailMessageModel>(json);

                            if (message != null)
                            {
                                await _emailSenderService.SendEmailAsync(message);
                                _logger.LogInformation("Email sent successfully to {To}", message.To);

                                // Acknowledge the message
                                await _channel.BasicAckAsync(result.DeliveryTag, multiple: false);
                            }
                            else
                            {
                                await _channel.BasicNackAsync(result.DeliveryTag, multiple: false, requeue: false);
                            }
                        }
                        else
                        {
                            // No message available, wait a bit
                            await Task.Delay(1000, stoppingToken);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error processing email message");
                        await Task.Delay(5000, stoppingToken); // Wait before retry
                    }
                }

                _logger.LogInformation("Email consumer started");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ExecuteAsync");
                throw;
            }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Email consumer is stopping");

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