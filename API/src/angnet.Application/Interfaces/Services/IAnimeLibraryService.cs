using angnet.Domain.Dtos;

namespace angnet.Application.Interfaces.Services;

public interface IAnimeLibraryService
{
    Task<AnimeLibraryCatalogDto> Browse(string keyword, int page, CancellationToken cancellationToken);
    Task<AnimeLibraryDetailDto> Detail(string slug, CancellationToken cancellationToken);
    Task<AnimeLibraryPlaybackDto> Playback(string slug, int server, string episode, CancellationToken cancellationToken);
}
