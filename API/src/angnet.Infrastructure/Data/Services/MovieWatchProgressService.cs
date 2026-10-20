using System.Text.RegularExpressions;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using Microsoft.EntityFrameworkCore;

namespace angnet.Infrastructure.Data.Services;

public class MovieWatchProgressService(AppDbContext db, IMovieLibraryService library) : IMovieWatchProgressService
{
    private const string Provider = "phimapi";

    public async Task<MovieWatchProgressDto?> Get(string userId, string slug, CancellationToken cancellationToken)
    {
        Validate(userId, slug);
        return await db.MovieWatchProgress.AsNoTracking()
            .Where(x => x.UserId == userId && x.Provider == Provider && x.MovieSlug == slug)
            .Select(x => new MovieWatchProgressDto
            {
                ServerId = x.ServerId, ServerName = x.ServerName,
                EpisodeSlug = x.EpisodeSlug, EpisodeName = x.EpisodeName, UpdatedAt = x.UpdatedAt
            }).SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<MovieWatchProgressDto> Save(string userId, string slug, MovieWatchProgressSaveDto data, CancellationToken cancellationToken)
    {
        Validate(userId, slug);
        if (data.ServerId < 0 || string.IsNullOrWhiteSpace(data.EpisodeSlug) || data.EpisodeSlug.Length > 200)
            throw new ArgumentException("Tập phim không hợp lệ.");

        // Timestamp before provider lookup: a slow older request must not overwrite a newer one.
        var now = DateTime.UtcNow;
        var movie = await library.Detail(slug, cancellationToken);
        var server = movie.Servers.SingleOrDefault(x => x.Id == data.ServerId)
            ?? throw new KeyNotFoundException("Nguồn phát không tồn tại.");
        var episode = server.Episodes.FirstOrDefault(x => x.Slug == data.EpisodeSlug && x.HasSource)
            ?? throw new KeyNotFoundException("Tập phim chưa có nguồn phát.");
        var serverName = server.Name.Length <= 200 ? server.Name : server.Name[..200];
        var episodeName = episode.Name.Length <= 200 ? episode.Name : episode.Name[..200];

        // PostgreSQL and SQLite both support this atomic upsert. One row per user/movie.
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "MovieWatchProgress" ("UserId", "Provider", "MovieSlug", "ServerId",
                "ServerName", "EpisodeSlug", "EpisodeName", "UpdatedAt")
            VALUES ({userId}, {Provider}, {slug}, {server.Id}, {serverName}, {episode.Slug}, {episodeName}, {now})
            ON CONFLICT ("UserId", "Provider", "MovieSlug") DO UPDATE SET
                "ServerId" = EXCLUDED."ServerId", "ServerName" = EXCLUDED."ServerName",
                "EpisodeSlug" = EXCLUDED."EpisodeSlug", "EpisodeName" = EXCLUDED."EpisodeName",
                "UpdatedAt" = EXCLUDED."UpdatedAt"
            WHERE "MovieWatchProgress"."UpdatedAt" <= EXCLUDED."UpdatedAt"
            """, cancellationToken);
        return (await Get(userId, slug, cancellationToken))!;
    }

    private static void Validate(string userId, string slug)
    {
        if (string.IsNullOrWhiteSpace(userId)) throw new UnauthorizedAccessException();
        if (string.IsNullOrEmpty(slug) || slug.Length > 200 || !Regex.IsMatch(slug, "^[a-z0-9]+(?:-[a-z0-9]+)*$"))
            throw new ArgumentException("Mã phim không hợp lệ.");
    }
}
