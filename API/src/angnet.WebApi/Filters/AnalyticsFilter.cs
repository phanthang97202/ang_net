using angnet.Domain.Dtos;
using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace angnet.WebApi.Filters;

// Count only successful public content responses with a browser navigation context.
// Admin editor/detail calls, authorization failures, provider failures and bots do not count.
public class AnalyticsFilter(WebAnalyticsService analytics) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executed = await next();
        var request = context.HttpContext.Request;
        if (executed.Exception != null || executed.Result is not OkObjectResult result
            || WebAnalyticsService.IsBot(request.Headers.UserAgent.ToString())) return;
        var session = request.Headers["X-Blog-Session"].ToString();
        var navigation = request.Headers["X-Blog-Navigation"].ToString();
        var path = request.Headers["X-Blog-Page"].ToString();
        if (!WebAnalyticsService.ValidContext(session, navigation, path)) return;
        var controller = context.RouteData.Values["controller"]?.ToString();
        var action = context.RouteData.Values["action"]?.ToString();
        if (controller == "News" && action == "Detail" && path.StartsWith("/news/")
            && result.Value is ApiResponse<RPNewsDto> { Success: true, Data: { FlagActive: true } news })
            await analytics.Record(session, navigation, "article", news.NewsId, news.ShortTitle, path);
        else if (controller == "MovieLibrary" && action == "Playback" && path.StartsWith("/phim/")
            && result.Value is ApiResponse<MovieLibraryPlaybackDto> { Success: true, Data: { } movie }
            && (!string.IsNullOrEmpty(movie.Url) || !string.IsNullOrEmpty(movie.EmbedUrl)))
        {
            var slug = context.ActionArguments["slug"]?.ToString() ?? "";
            var title = context.HttpContext.Items["AnalyticsMovieTitle"] as string ?? slug;
            await analytics.Record(session, navigation, "movie", slug, title, $"/phim/{slug}",
                $"{context.ActionArguments["server"]}:{context.ActionArguments["episode"]}");
        }
        else if (controller == "Reel" && action == "View" && path == "/reels"
            && result.Value is ApiResponse<ReelDto> { Success: true })
        {
            var id = context.ActionArguments["reelId"]?.ToString() ?? "";
            await analytics.Record(session, navigation, "reel", id, "", "/reels");
        }
    }
}
