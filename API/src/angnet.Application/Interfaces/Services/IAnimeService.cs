using angnet.Domain.Dtos;

namespace angnet.Application.Interfaces.Services
{
    public interface IAnimeService
    {
        Task<ApiResponse<AnimeSearchItemDto>> Search(string keyword, int page, int pageSize);
        Task<ApiResponse<AnimeDetailDto>> GetDetail(int aniListId);
        Task<ApiResponse<AnimePlaybackDto>> GetPlayback(int aniListId, int episodeNumber);
    }
}
