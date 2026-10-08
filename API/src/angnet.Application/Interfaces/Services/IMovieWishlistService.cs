using angnet.Domain.Dtos;

namespace angnet.Application.Interfaces.Services;

public interface IMovieWishlistService
{
    Task<MovieLibraryCatalogDto> Browse(string userId, string keyword, int page, CancellationToken cancellationToken);
    Task MarkSaved(string userId, IEnumerable<MovieLibraryItemDto> movies, CancellationToken cancellationToken);
    Task<bool> Save(string userId, string slug, CancellationToken cancellationToken);
    Task<bool> Remove(string userId, string slug, CancellationToken cancellationToken);
}
