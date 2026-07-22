using angnet.Application.Interfaces.Repositories;
using angnet.Domain.Dtos;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using StackExchange.Redis;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;

namespace angnet.Infrastructure.Data.Repositories
{
    public class VisitStatsRespository : CommonRespository, IVisitStatsRespository
    {
        // near-real-time online window: a visitor is considered online if it
        // heartbeated within the last 90 seconds (3x the 30s client heartbeat
        // interval, to tolerate background-tab timer throttling)
        private const int OnlineWindowSeconds = 90;

        public VisitStatsRespository(IConnectionMultiplexer connectionMultiplexer
                                     , IHttpContextAccessor httpContextAccessor
                                     , IWebHostEnvironment env) : base(connectionMultiplexer, httpContextAccessor, env)
        {
        }

        public async Task<ApiResponse<VisitStatsDto>> PingAsync(string visitorId, bool isNewVisit)
        {
            ApiResponse<VisitStatsDto> apiResponse = new ApiResponse<VisitStatsDto>();
            List<RequestClient> requestClient = new List<RequestClient>();

            if (TCommonUtils.IsNullOrEmpty(visitorId))
            {
                apiResponse.CatchException(false, "VisitStats_Ping.VisitorIdIsRequired", requestClient);
                return apiResponse;
            }

            IDatabase redisDb = GetRedisDb();
            DateTime now = TCommonUtils.DTimeNow();
            double nowUnixSeconds = ((DateTimeOffset)now).ToUnixTimeSeconds();

            string onlineKey = GenerateUniqueCacheKey("visit_online", "", false);
            string totalKey = GenerateUniqueCacheKey("visit_total", "", false);
            string monthKey = GenerateUniqueCacheKey("visit_month_", now.ToString("yyyyMM"), false);

            // Mark/refresh this visitor's presence
            await redisDb.SortedSetAddAsync(onlineKey, visitorId, nowUnixSeconds);

            // Count a new visit only once per browser tab (client decides via isNewVisit)
            if (isNewVisit)
            {
                await redisDb.StringIncrementAsync(totalKey);
                await redisDb.StringIncrementAsync(monthKey);
            }

            // Prune stale presence entries before counting who's online
            await redisDb.SortedSetRemoveRangeByScoreAsync(onlineKey, double.NegativeInfinity, nowUnixSeconds - OnlineWindowSeconds);

            long onlineCount = await redisDb.SortedSetLengthAsync(onlineKey);
            RedisValue totalValue = await redisDb.StringGetAsync(totalKey);
            RedisValue monthValue = await redisDb.StringGetAsync(monthKey);

            apiResponse.Data = new VisitStatsDto
            {
                OnlineCount = (int)onlineCount,
                TotalCount = totalValue.IsNullOrEmpty ? 0 : (long)totalValue,
                MonthCount = monthValue.IsNullOrEmpty ? 0 : (long)monthValue,
            };

            return apiResponse;
        }
    }
}
