using angnet.Domain.Dtos;

namespace angnet.Application.Interfaces.Services
{
    public interface INoteService
    {
        Task<ApiResponse<NoteDto>> GetPublicFeed(int pageSize, string cursor);
        Task<ApiResponse<NoteDto>> Create(NoteCreateDto data);
        Task<ApiResponse<NoteDto>> SearchAdmin(int pageIndex, int pageSize, string keyword, bool? onlyActive);
        Task<ApiResponse<NoteDto>> ToggleActive(string noteId, bool flagActive, string actorId);
        Task<ApiResponse<bool>> Delete(string noteId);
    }
}
