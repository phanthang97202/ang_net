using angnet.Domain.Dtos;
using angnet.Utility.CommonUtils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using StackExchange.Redis;
using System.Net;

namespace angnet.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = "blog.noticenews")]
    [EnableRateLimiting("API")]
    public class CacheController : ControllerBase
    {
        private readonly IConnectionMultiplexer _connectionMultiplexer;

        public CacheController(IConnectionMultiplexer connectionMultiplexer)
        {
            _connectionMultiplexer = connectionMultiplexer;
        }

        /// <summary>
        /// Xoa toan bo cache bai viet (danh sach, cay danh muc va chi tiet).
        /// Khong dung FlushDatabase vi Redis con luu thong ke truy cap va co the duoc
        /// dung chung boi cac tinh nang khac.
        /// </summary>
        [HttpDelete("News")]
        public async Task<ActionResult<ApiResponse<CacheClearResultDto>>> ClearNews()
        {
            IDatabase database = _connectionMultiplexer.GetDatabase();
            HashSet<RedisKey> keys =
            [
                ConstValue.NewsRespository_Search,
                ConstValue.NewsRespository_CategoryPreview
            ];

            // Cache chi tiet co newsId trong ten key, nen can SCAN theo namespace.
            // Thao tac nay chi nguoi co quyen van hanh noi dung moi duoc goi thu cong;
            // KeysAsync su dung SCAN,
            // khong chan Redis nhu lenh KEYS.
            foreach (EndPoint endpoint in _connectionMultiplexer.GetEndPoints())
            {
                IServer server = _connectionMultiplexer.GetServer(endpoint);
                if (!server.IsConnected || server.IsReplica)
                {
                    continue;
                }

                await foreach (RedisKey key in server.KeysAsync(
                    database.Database,
                    pattern: $"{ConstValue.NewsRespository_Detail}*",
                    pageSize: 250))
                {
                    keys.Add(key);
                }
            }

            long deletedKeyCount = keys.Count == 0
                ? 0
                : await database.KeyDeleteAsync(keys.ToArray());

            return Ok(new ApiResponse<CacheClearResultDto>(new CacheClearResultDto
            {
                DeletedKeyCount = deletedKeyCount,
                ClearedAtUtc = DateTime.UtcNow
            }));
        }
    }
}
