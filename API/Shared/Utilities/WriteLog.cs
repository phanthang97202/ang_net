using System.Text.Json;

namespace API.Shared.Utilities
{
    public class WriteLog
    {
        private readonly ILogger<WriteLog> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public WriteLog(ILogger<WriteLog> logger, IHttpContextAccessor httpContextAccessor)
        {
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        public void LogInformation(string title, object req, object res)
        {
            HttpContext httpContext = _httpContextAccessor.HttpContext;
            var ipAddressClient = _httpContextAccessor.HttpContext.Connection.RemoteIpAddress?.ToString();
            string strLog = @"
                        ------------------------------------------------
                                        {title}
                        ------------------------------------------------
                        Method       : {Method}
                        Path         : {Path}
                        IP Address   : {IPAddress}  
                        Request Body : {Request}
                        Response     : {Response}
                        ------------------------------------------------
                        ";
            _logger.LogInformation(strLog,
                                    title,
                                    httpContext.Request.Method,
                                    httpContext.Request.Path,
                                    ipAddressClient,
                                    JsonSerializer.Serialize(req),
                                    JsonSerializer.Serialize(res)
                                    );
        }

        public void LogError(string title, object req, Exception errMsg)
        {
            HttpContext httpContext = _httpContextAccessor.HttpContext;
            var ipAddressClient = _httpContextAccessor.HttpContext.Connection.RemoteIpAddress?.ToString();
            string strLog = @"
                        ------------------------------------------------
                                        {title}
                        ------------------------------------------------
                        Method       : {Method}
                        Path         : {Path}
                        IP Address   : {IPAddress}
                        Request Body : {Request}
                        Response     : {Response}
                        ------------------------------------------------
                        ";
            _logger.LogError(strLog,
                                    title,
                                    httpContext.Request.Method,
                                    httpContext.Request.Path,
                                    ipAddressClient,
                                    JsonSerializer.Serialize(req),
                                    errMsg
                                    );
        }

        public void LogWarning(string title, object req = null, Exception errMsg = null)
        {
            HttpContext httpContext = _httpContextAccessor.HttpContext;
            var ipAddressClient = _httpContextAccessor.HttpContext.Connection.RemoteIpAddress?.ToString();
            string strLog = @"
                        ------------------------------------------------
                                        {title}
                        ------------------------------------------------
                        Method       : {Method}
                        Path         : {Path}
                        IP Address   : {IPAddress}
                        Request Body : {Request}
                        Response     : {Response}
                        ------------------------------------------------
                        ";
            _logger.LogWarning(strLog,
                                    title,
                                    httpContext.Request.Method,
                                    httpContext.Request.Path,
                                    ipAddressClient,
                                    JsonSerializer.Serialize(req),
                                    errMsg
                                    );
        }

        public IDisposable BeginScope<TState>(TState state) where TState : notnull
        {
            throw new NotImplementedException();
        }

        public bool IsEnabled(LogLevel logLevel)
        {
            throw new NotImplementedException();
        }

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception exception, Func<TState, Exception, string> formatter)
        {
            throw new NotImplementedException();
        }

        // override other log type
    }
}
