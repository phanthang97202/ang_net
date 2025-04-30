using StackExchange.Redis;
using System.Security.Claims;
using TCommonUtils = CommonUtils.CommonUtils.CommonUtils;
using TConstValue = CommonUtils.CommonUtils.ConstValue;

namespace API.Respositories
{
    public class CommonRespository
    {
        public readonly IConnectionMultiplexer _connectionMultiplexer;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CommonRespository(IConnectionMultiplexer connectionMultiplexer 
                                 ,IHttpContextAccessor httpContextAccessor)
        {
            _connectionMultiplexer = connectionMultiplexer;
            _httpContextAccessor = httpContextAccessor;
        }
          
        public async Task SetCacheAsync<T>(string keyCache, T data, int expiredMinutes = TConstValue.CACHE_EXPIRED_TIME)
        {

            TimeSpan _expired = TimeSpan.FromMinutes(expiredMinutes);

            IDatabase redisDb = _connectionMultiplexer.GetDatabase();
            string content = TCommonUtils.ConvertToJsonStringify<T>(data);
            
            await redisDb.StringSetAsync(keyCache, content, _expired);
        }

        public async Task<T> GetCacheAsync<T>(string keyCache)
        {
            IDatabase redisDb = _connectionMultiplexer.GetDatabase();
            RedisValue content = await redisDb.StringGetAsync(keyCache);
            if (string.IsNullOrEmpty(content)) { 
                return default(T);
            }

            return TCommonUtils.ParseJsonStringify<T>(content);
        }

        //public async Task IsExistKeyCacheAsync()
        //{

        //}

        /*
            Parameter: 
                cacheKey: whatever name you want
                primaryKey is specify record which you want to cache data
        */
        public string GenerateUniqueCacheKey(string cacheKey, string primaryKey, bool isIdentity = false)
        {
            string userId;
            if (isIdentity == false)
            {
                userId = "";
            }
            else
            {
                userId = _httpContextAccessor.HttpContext?.User?.FindFirst("sub")?.Value
                         ?? _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    throw new Exception("User ID not found in token.");
                }
            }

            string key = userId + "." + cacheKey + "." + primaryKey;
            return key;
        }
    }
}
