using angnet.Domain.Dtos;

namespace angnet.Application.Interfaces.Services;

public interface IMovieViewLogService
{
    Task<bool> RecordAsync(MovieViewWriteDto data, CancellationToken ct = default);
}
