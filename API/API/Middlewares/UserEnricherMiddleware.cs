using Serilog.Context;
using System.Security.Claims;
using TCommonUtils = CommonUtils.CommonUtils.CommonUtils;

namespace API.API.Middlewares
{
    public class UserEnricherMiddleware
    {
        private readonly RequestDelegate _next;

        public UserEnricherMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!TCommonUtils.IsNullOrEmpty(userId))
            {
                using (LogContext.PushProperty("UserId", userId))
                {
                    await _next(context);
                }
            }
            else
            {
                await _next(context);
            }
        }
    }
}
