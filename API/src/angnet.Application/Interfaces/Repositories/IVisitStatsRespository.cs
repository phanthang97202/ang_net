using angnet.Domain.Dtos;

namespace angnet.Application.Interfaces.Repositories
{
    public interface IVisitStatsRespository
    {
        Task<ApiResponse<VisitStatsDto>> PingAsync(string visitorId, bool isNewVisit);
    }
}
