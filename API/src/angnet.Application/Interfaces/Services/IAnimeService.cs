using angnet.Domain.Dtos;

namespace angnet.Application.Interfaces.Services
{
    public interface IAnimeService
    {
        Task<ApiResponse<AnimeSearchItemDto>> Search(string keyword, int page, int pageSize);
        Task<ApiResponse<AnimeDetailDto>> GetDetail(int aniListId);
        Task<ApiResponse<AnimePlaybackDto>> GetPlayback(int aniListId, int episodeNumber);
        Task<ApiResponse<AnimeAdminCatalogDto>> GetAdminCatalog(string keyword);
        Task<ApiResponse<AnimeDetailDto>> Import(int aniListId, string actorId);
        Task<ApiResponse<AnimeAdminEpisodeDto>> GetAdminEpisodes(int aniListId);
        Task<ApiResponse<AnimeSourceDto>> SaveSource(AnimeSourceSaveDto data, string actorId);
        Task<ApiResponse<AnimeSourceDto>> ToggleSource(string sourceId, bool flagActive, string actorId);
        Task<ApiResponse<bool>> DeleteSource(string sourceId);
    }
}
