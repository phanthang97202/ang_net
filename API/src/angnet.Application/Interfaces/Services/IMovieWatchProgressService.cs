using angnet.Domain.Dtos;

namespace angnet.Application.Interfaces.Services;

public interface IMovieWatchProgressService
{
    Task<MovieWatchProgressDto?> Get(string userId, string slug, CancellationToken cancellationToken);
    Task<MovieWatchProgressDto> Save(string userId, string slug, MovieWatchProgressSaveDto data, CancellationToken cancellationToken);
}
