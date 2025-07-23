using angnet.Utility.CommonUtils;
using Microsoft.AspNetCore.Http;
using Serilog;
using System;
using System.Text.Json;
using System.Threading.Tasks;

namespace angnet.WebApi.MIddlewares
{
    public class GlobalExceptionHandlerMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly WriteLog _writeLog;

        public GlobalExceptionHandlerMiddleware(RequestDelegate next, WriteLog writeLog)
        {
            _next = next;
            _writeLog = writeLog;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                // Proceed with the request pipeline
                await _next(context);
            }
            catch (Exception ex)
            {
                string title = "500 Internal Server Error | The server has encountered a situation it does not know how to handle.";
                var exc = new
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Message = title,
                    DetailException = new
                    {
                        ex.Message,
                        ex.StackTrace,
                        InnerException = ex.InnerException?.Message, // You can include InnerException message or null if no InnerException
                        ex.Source
                    }
                };
                // Log the exception details (you can customize logging here)
                _writeLog.LogError(title, exc, ex);

                // Return a 500 Internal Server Error with a friendly message
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(exc);
            }
        }
    }
}
