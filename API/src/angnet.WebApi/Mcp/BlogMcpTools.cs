using System.ComponentModel;
using angnet.Application.Interfaces.Repositories;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.Domain.Enums;
using angnet.Infrastructure.Data;
using Ganss.Xss;
using Microsoft.EntityFrameworkCore;
using ModelContextProtocol;
using ModelContextProtocol.Server;

namespace angnet.WebApi.Mcp;

[McpServerToolType]
public sealed class BlogMcpTools(IHttpContextAccessor contexts, BlogMcpAccess access,
    INewsRespository news, INewsCategoryService categories, AppDbContext db, BlogMcpOptions settings)
{
    private System.Security.Claims.ClaimsPrincipal User => contexts.HttpContext!.User;

    [McpServerTool(Name = "get_categories", ReadOnly = true, Destructive = false, OpenWorld = false)]
    [Description("Get active blog categories before drafting a post. Does not modify any data.")]
    public async Task<object> GetCategories()
    {
        await access.Require(User, BlogMcpOptions.ReadScope);
        var result = await categories.GetAllActive();
        if (!result.Success) throw new McpException(result.ErrorMessage ?? "Unable to load categories.");
        return (object?)result.DataList ?? Array.Empty<object>();
    }

    [McpServerTool(Name = "search_posts", ReadOnly = true, Destructive = false, OpenWorld = false)]
    [Description("Find related published public posts or duplicate titles. includeMyDrafts adds only YOUR drafts; never returns someone else's private content.")]
    public async Task<object> SearchPosts(string keyword = "", string categoryId = "", bool includeMyDrafts = false,
        int pageIndex = 0, int pageSize = 10)
    {
        var user = await access.Require(User, BlogMcpOptions.ReadScope);
        keyword ??= "";
        if (keyword.Length > 200 || pageIndex < 0 || pageIndex > 1000 || pageSize < 1 || pageSize > 30)
            throw new McpException("Invalid search parameters.");
        var query = db.News.AsNoTracking().Where(n => (n.FlagActive && n.WhoCanSee == EWhoCanSee.Public)
            || (includeMyDrafts && n.UserId == user.Id));
        if (!string.IsNullOrWhiteSpace(keyword)) query = query.Where(n => n.ShortTitle.Contains(keyword) || n.ShortTitleEn.Contains(keyword));
        if (!string.IsNullOrWhiteSpace(categoryId)) query = query.Where(n => n.CategoryNewsId == categoryId);
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(n => n.CreatedDTime).Skip(pageIndex * pageSize).Take(pageSize)
            .Select(n => new { n.NewsId, n.CategoryNewsId, n.ShortTitle, n.ShortTitleEn, n.ShortDescription, n.ShortDescriptionEn,
                n.FlagActive, n.WhoCanSee, n.Thumbnail, n.CreatedDTime }).ToListAsync();
        return new { total, pageIndex, pageSize, posts = items.Select(n => new
        {
            post = n,
            url = settings.BlogUrl.TrimEnd('/') + "/news/" + Uri.EscapeDataString(n.CategoryNewsId) + "/" + Uri.EscapeDataString(n.NewsId)
        }) };
    }

    [McpServerTool(Name = "get_post", ReadOnly = true, Destructive = false, OpenWorld = false)]
    [Description("Read a published public post or a post owned by your linked account, including both languages. Does not increase view count.")]
    public async Task<object> GetPost(string newsId)
    {
        var user = await access.Require(User, BlogMcpOptions.ReadScope);
        var item = await db.News.AsNoTracking().Where(n => n.NewsId == newsId
            && ((n.FlagActive && n.WhoCanSee == EWhoCanSee.Public) || n.UserId == user.Id))
            .Select(n => new { n.NewsId, n.CategoryNewsId, n.ShortTitle, n.ShortTitleEn, n.ShortDescription, n.ShortDescriptionEn,
                n.ContentBody, n.ContentBodyEn, n.Thumbnail, n.FlagActive, n.WhoCanSee }).SingleOrDefaultAsync();
        return item ?? throw new McpException("Post not found or access denied.");
    }

    [McpServerTool(Name = "create_post", ReadOnly = false, Destructive = false, OpenWorld = false)]
    [Description("Create ONE blog post from semantic HTML. Defaults to a private draft. publish=true makes it PUBLIC and requires blog.publish scope and mcp.publish permission. Search for duplicates first. A repeated existing title is not overwritten. Do not retry blindly after a timeout; search again.")]
    public async Task<object> CreatePost(NewsDto post, bool publish = false)
    {
        var user = await access.Require(User, BlogMcpOptions.WriteScope, "blog.create");
        if (publish) await access.Require(User, BlogMcpOptions.PublishScope, "mcp.publish");
        Prepare(post);
        if (!await db.NewsCategory.AnyAsync(c => c.NewsCategoryId == post.CategoryNewsId && c.FlagActive))
            throw new McpException("Select an active category returned by get_categories.");
        post.FlagActive = publish;
        post.WhoCanSee = publish ? EWhoCanSee.Public : EWhoCanSee.Private;
        var duplicate = await db.News.AsNoTracking().FirstOrDefaultAsync(n => n.ShortTitle == post.ShortTitle);
        if (duplicate is not null) throw new McpException("A post with this title already exists. No post was created or overwritten.");
        var result = await news.Create(User, post);
        if (!result.Success) throw new McpException(result.ErrorMessage ?? "Unable to create post.");
        var saved = await db.News.AsNoTracking().SingleAsync(n => n.UserId == user.Id && n.ShortTitle == post.ShortTitle);
        return new { saved.NewsId, saved.ShortTitle, saved.ShortTitleEn, saved.FlagActive, saved.WhoCanSee,
            url = settings.BlogUrl.TrimEnd('/') + "/news/" + saved.CategoryNewsId + "/" + saved.NewsId };
    }

    [McpServerTool(Name = "publish_post", ReadOnly = false, Destructive = false, OpenWorld = false)]
    [Description("Publish a private draft owned by YOUR account. Makes the content publicly readable. Does not edit content or publish another user's post. Requires explicit user authorization to publish.")]
    public async Task<object> PublishPost(string newsId)
    {
        var user = await access.Require(User, BlogMcpOptions.PublishScope, "mcp.publish", "blog.update");
        var existing = await db.News.AsNoTracking().SingleOrDefaultAsync(n => n.NewsId == newsId && n.UserId == user.Id)
            ?? throw new McpException("Post not found or not owned by your account.");
        if (existing.FlagActive && existing.WhoCanSee == EWhoCanSee.Public)
            return new { existing.NewsId, published = true, alreadyPublished = true };
        var tags = await db.HashTagNews.AsNoTracking().Where(t => t.NewsId == newsId).ToListAsync();
        var files = await db.RefFileNews.AsNoTracking().Where(f => f.NewsId == newsId).ToListAsync();
        var update = new UpdateNewsDto
        {
            NewsId = newsId, Thumbnail = existing.Thumbnail, CategoryNewsId = existing.CategoryNewsId,
            ShortTitle = existing.ShortTitle, ShortTitleEn = existing.ShortTitleEn,
            ShortDescription = existing.ShortDescription, ShortDescriptionEn = existing.ShortDescriptionEn,
            ContentBody = existing.ContentBody, ContentBodyEn = existing.ContentBodyEn,
            FlagActive = true, WhoCanSee = EWhoCanSee.Public,
            LstHashTagNews = tags.Where(t => t.LanguageCode == "vi").Select(t => new HashTagNewsDto { HashTagNewsName = t.HashTagNewsName }).ToList(),
            LstHashTagNewsEn = tags.Where(t => t.LanguageCode == "en").Select(t => new HashTagNewsDto { HashTagNewsName = t.HashTagNewsName }).ToList(),
            LstRefFileNews = files.Select(f => new RefFileNewsDto { FileUrl = f.FileUrl }).ToList()
        };
        var result = await news.Update(User, update);
        if (!result.Success) throw new McpException(result.ErrorMessage ?? "Unable to publish post.");
        return new { newsId, published = true, url = settings.BlogUrl.TrimEnd('/') + "/news/" + existing.CategoryNewsId + "/" + newsId };
    }

    internal static void Prepare(NewsDto post)
    {
        if (post is null) throw new McpException("A post is required.");
        post.ShortTitle = post.ShortTitle?.Trim() ?? "";
        post.ShortDescription = post.ShortDescription?.Trim() ?? "";
        post.ShortTitleEn = post.ShortTitleEn?.Trim() ?? "";
        post.ShortDescriptionEn = post.ShortDescriptionEn?.Trim() ?? "";
        post.ContentBodyEn ??= "";
        post.LstHashTagNews ??= [];
        post.LstHashTagNewsEn ??= [];
        post.LstRefFileNews ??= [];
        if (string.IsNullOrWhiteSpace(post.ShortTitle) || post.ShortTitle.Length > 250
            || string.IsNullOrWhiteSpace(post.ShortDescription) || post.ShortDescription.Length > 2000
            || string.IsNullOrWhiteSpace(post.ContentBody) || post.ContentBody.Length > 500_000
            || post.ContentBodyEn.Length > 500_000 || post.ShortTitleEn.Length > 250 || post.ShortDescriptionEn.Length > 2000
            || post.LstHashTagNews.Count > 20 || post.LstHashTagNewsEn.Count > 20)
            throw new McpException("Provide a title, description and HTML body within the supported size limits.");
        if (post.LstHashTagNews.Concat(post.LstHashTagNewsEn).Any(t => t is null
                || string.IsNullOrWhiteSpace(t.HashTagNewsName) || t.HashTagNewsName.Length > 30)
            || post.LstRefFileNews.Count != 0)
            throw new McpException("Keywords must be 1–30 characters. File attachments are not supported by MCP.");
        var sanitizer = new HtmlSanitizer();
        sanitizer.AllowedTags.Remove("h1");
        sanitizer.AllowedAttributes.Remove("style");
        post.ContentBody = sanitizer.Sanitize(post.ContentBody);
        post.ContentBodyEn = sanitizer.Sanitize(post.ContentBodyEn);
        if (string.IsNullOrWhiteSpace(post.ContentBody)) throw new McpException("The HTML body is empty after sanitization.");
        if (!string.IsNullOrEmpty(post.Thumbnail) && (!Uri.TryCreate(post.Thumbnail, UriKind.Absolute, out var thumbnail)
            || thumbnail.Scheme != "https")) throw new McpException("Thumbnail must be an HTTPS image URL or empty.");
        // Media are external URLs; this tool never downloads files or uploads to Cloudinary.
    }
}
