using angnet.Domain.Dtos;
using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace angnet.WebApi.Filters;

// Count only successful public content responses with a browser navigation context.
// Admin editor/detail calls, authorization failures, provider failures and bots do not count.
public class AnalyticsFilter(WebAnalyticsService analytics, ILogger<AnalyticsFilter>? logger = null) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executed = await next();
        var request = context.HttpContext.Request;
        if (executed.Exception != null || context.HttpContext.RequestAborted.IsCancellationRequested || executed.Result is not OkObjectResult result
            || WebAnalyticsService.IsBot(request.Headers.UserAgent.ToString())) return;
        var session = request.Headers["X-Blog-Session"].ToString();
        var navigation = request.Headers["X-Blog-Navigation"].ToString();
        var visitor = request.Headers["X-Blog-Visitor"].ToString();
        var path = request.Headers["X-Blog-Page"].ToString();
        if (!WebAnalyticsService.ValidContext(session, navigation, path)) return;
        var controller = context.RouteData.Values["controller"]?.ToString();
        var action = context.RouteData.Values["action"]?.ToString();
        if (controller == "News" && action == "Detail" && path.StartsWith("/news/")
            && result.Value is ApiResponse<RPNewsDto> { Success: true, Data: { FlagActive: true } news })
        {
            if (await analytics.Record(session, navigation, "article", news.NewsId, news.ShortTitle, path, visitorId: visitor))
                try { news.ViewCount = await analytics.ArticleCounter(news.NewsId); }
                catch (Exception ex) { logger?.LogWarning(ex, "Could not refresh the public article counter after analytics recording"); }
        }
        else if (controller == "Reel" && action == "View" && path == "/reels"
            && result.Value is ApiResponse<ReelDto> { Success: true })
        {
            var id = context.ActionArguments["reelId"]?.ToString() ?? "";
            if (await analytics.Record(session, navigation, "reel", id, "", "/reels", visitorId: visitor))
                try { result.Value = new ApiResponse<ReelDto> { objResult = new { ReelId = id, ViewCount = await analytics.ReelCounter(id) } }; }
                catch (Exception ex) { logger?.LogWarning(ex, "Could not refresh the public reel counter after analytics recording"); }
        }
    }
}
