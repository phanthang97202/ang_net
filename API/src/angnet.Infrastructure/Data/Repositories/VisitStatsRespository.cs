using angnet.Application.Interfaces.Repositories;
using angnet.Domain.Dtos;
using angnet.Infrastructure.Data.Services;

namespace angnet.Infrastructure.Data.Repositories;

// Compatibility for already-open clients. This endpoint no longer owns counters
// or writes to Redis; modern clients send events once through Analytics/Track.
public class VisitStatsRespository(WebAnalyticsService analytics) : IVisitStatsRespository
{
    public async Task<ApiResponse<VisitStatsDto>> PingAsync(string visitorId, bool isNewVisit) =>
        new(await analytics.PublicStats());
}
