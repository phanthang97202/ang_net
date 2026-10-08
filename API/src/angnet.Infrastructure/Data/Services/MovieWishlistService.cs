using System.Text.RegularExpressions;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace angnet.Infrastructure.Data.Services;

public class MovieWishlistService(AppDbContext db, IMovieLibraryService library) : IMovieWishlistService
{
    private const string Provider = "phimapi";
    private const int PageSize = 24;

    private IQueryable<MovieWishlistModel> Saved(string userId)
    {
        ValidateUser(userId);
        return db.MovieWishlist.AsNoTracking()
            .Where(x => x.UserId == userId && x.Provider == Provider && x.FlagActive);
    }

    public async Task<MovieLibraryCatalogDto> Browse(string userId, string keyword, int page, CancellationToken cancellationToken)
    {
        keyword = (keyword ?? "").Trim();
        if (keyword.Length > 100 || page is < 1 or > 10000)
            throw new ArgumentException("Từ khóa hoặc số trang không hợp lệ.");
        var query = Saved(userId);
        if (keyword.Length > 0)
        {
            var term = keyword.ToLower();
            query = query.Where(x => x.Title.ToLower().Contains(term) || x.OriginalTitle.ToLower().Contains(term));
        }
        var total = await query.CountAsync(cancellationToken);
        var pages = Math.Max(1, (int)Math.Ceiling(total / (double)PageSize));
        page = Math.Min(page, pages);
        var items = await query.OrderByDescending(x => x.CreatedDTime).ThenByDescending(x => x.WishlistId)
            .Skip((page - 1) * PageSize).Take(PageSize)
            .Select(x => new MovieLibraryItemDto
            {
                Slug = x.MovieSlug, Title = x.Title, OriginalTitle = x.OriginalTitle,
                PosterUrl = x.PosterUrl, Year = x.Year, IsWishlisted = true
            }).ToListAsync(cancellationToken);
        return new MovieLibraryCatalogDto { Items = items, Page = page, TotalPages = pages, TotalItems = total };
    }

    public async Task MarkSaved(string userId, IEnumerable<MovieLibraryItemDto> movies, CancellationToken cancellationToken)
    {
        var items = movies.ToList();
        var slugs = items.Select(x => x.Slug).ToArray();
        var saved = await Saved(userId).Where(x => slugs.Contains(x.MovieSlug))
            .Select(x => x.MovieSlug).ToListAsync(cancellationToken);
        var lookup = saved.ToHashSet(StringComparer.Ordinal);
        foreach (var movie in items) movie.IsWishlisted = lookup.Contains(movie.Slug);
    }

    public async Task<bool> Save(string userId, string slug, CancellationToken cancellationToken)
    {
        ValidateUser(userId);
        ValidateSlug(slug);
        // Resolve trusted metadata, not arbitrary titles or URLs supplied by the client.
        var movie = await library.Detail(slug, cancellationToken);
        var id = Guid.NewGuid().ToString();
        var now = DateTime.UtcNow;
        var title = Clip(movie.Title, 500);
        var originalTitle = Clip(movie.OriginalTitle, 500);
        var poster = movie.PosterUrl.Length <= 2048 ? movie.PosterUrl : "";
        // Atomic upsert makes repeated/concurrent Save requests idempotent.
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "MovieWishlist" ("WishlistId", "UserId", "Provider", "MovieSlug",
                "Title", "OriginalTitle", "PosterUrl", "Year", "FlagActive",
                "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime")
            VALUES ({id}, {userId}, {Provider}, {slug}, {title}, {originalTitle}, {poster},
                {movie.Year}, true, {userId}, {userId}, {now}, {now})
            ON CONFLICT ("UserId", "Provider", "MovieSlug") DO UPDATE SET
                "Title" = EXCLUDED."Title", "OriginalTitle" = EXCLUDED."OriginalTitle",
                "PosterUrl" = EXCLUDED."PosterUrl", "Year" = EXCLUDED."Year",
                "FlagActive" = true, "UpdatedBy" = EXCLUDED."UpdatedBy", "UpdatedDTime" = EXCLUDED."UpdatedDTime",
                "CreatedDTime" = CASE WHEN "MovieWishlist"."FlagActive" THEN "MovieWishlist"."CreatedDTime"
                    ELSE EXCLUDED."CreatedDTime" END
            """, cancellationToken);
        return true;
    }

    public async Task<bool> Remove(string userId, string slug, CancellationToken cancellationToken)
    {
        ValidateSlug(slug);
        await Saved(userId).Where(x => x.MovieSlug == slug)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.FlagActive, false)
                .SetProperty(x => x.UpdatedBy, userId).SetProperty(x => x.UpdatedDTime, DateTime.UtcNow), cancellationToken);
        return false;
    }

    private static string Clip(string value, int length) => value.Length <= length ? value : value[..length];
    private static void ValidateUser(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId)) throw new UnauthorizedAccessException();
    }
    private static void ValidateSlug(string slug)
    {
        if (string.IsNullOrEmpty(slug) || slug.Length > 200 || !Regex.IsMatch(slug, "^[a-z0-9]+(?:-[a-z0-9]+)*$"))
            throw new ArgumentException("Mã phim không hợp lệ.");
    }
}
