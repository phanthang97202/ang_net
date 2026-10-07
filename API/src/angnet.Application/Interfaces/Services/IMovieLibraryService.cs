using angnet.Domain.Dtos;

namespace angnet.Application.Interfaces.Services;

public interface IMovieLibraryService
{
    Task<MovieLibraryCatalogDto> Browse(string keyword, int page, CancellationToken cancellationToken);
    Task<MovieLibraryDetailDto> Detail(string slug, CancellationToken cancellationToken);
    Task<MovieLibraryPlaybackDto> Playback(string slug, int server, string episode, CancellationToken cancellationToken);
}
