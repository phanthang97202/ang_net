using Microsoft.Extensions.Configuration;
using RabbitMQ.Client; 

namespace angnet.Infrastructure.Mail.Factory
{
    public class RabbitMqConnectionFactory
    {
        private readonly IConfiguration _config;
        private IConnection? _connection;

        public RabbitMqConnectionFactory(IConfiguration config)
        {
            _config = config;
        }

        public async Task<(IConnection, IChannel)> CreateConnectionAndChannelAsync(string queueName)
        {
            if (_connection == null || !_connection.IsOpen)
            {
                var conStr = _config.GetSection("CloudAMQP")["AMQPConnectionString"];
                if (string.IsNullOrEmpty(conStr))
                    throw new Exception("Cannot find AMQP connection string");

                var factory = new ConnectionFactory { Uri = new Uri(conStr) };
                _connection = await factory.CreateConnectionAsync();
            }

            var channel = await _connection.CreateChannelAsync();

            await channel.QueueDeclareAsync(
                queue: queueName,
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: new Dictionary<string, object?>
                {
                { "x-dead-letter-exchange", "dead_letter_exchange" },
                { "x-dead-letter-routing-key", "send_email_failed" },
                { "x-message-ttl", 60000 }
                });

            return (_connection, channel);
        }
    }

}
