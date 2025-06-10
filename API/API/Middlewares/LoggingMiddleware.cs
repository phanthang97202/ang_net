using API.API.Filters;
using Microsoft.AspNetCore.Http;

namespace API.API.MIddlewares
{
    public class LoggingMiddleware
    {
        private readonly RequestDelegate _next;

        public LoggingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var endpoint = context.GetEndpoint();
            bool skipLogging = endpoint?.Metadata.GetMetadata<SkipLoggingAttribute>() != null;

            // Set a Serilog context property dynamically
            Serilog.Context.LogContext.PushProperty("SkipLogging", skipLogging);

            await _next(context);
        }

    }
}
