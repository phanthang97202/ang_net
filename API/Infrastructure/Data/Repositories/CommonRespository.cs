using StackExchange.Redis;
using System.Security.Claims;
using TCommonUtils = CommonUtils.CommonUtils.CommonUtils;
using TConstValue = CommonUtils.CommonUtils.ConstValue;

namespace API.Infrastructure.Data.Repositories
{
    public class CommonRespository
    {
        public readonly IConnectionMultiplexer _connectionMultiplexer;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IDatabase _redisDb;

        public CommonRespository(IConnectionMultiplexer connectionMultiplexer
                                 , IHttpContextAccessor httpContextAccessor)
        {
            _connectionMultiplexer = connectionMultiplexer;
            _httpContextAccessor = httpContextAccessor;
            _redisDb = _connectionMultiplexer.GetDatabase();
        }

        public IDatabase GetRedisDb()
        {
            return _connectionMultiplexer.GetDatabase();
        }

        public async Task SetCacheAsync<T>(string keyCache, T data, int expiredMinutes = TConstValue.CACHE_EXPIRED_TIME)
        {

            TimeSpan _expired = TimeSpan.FromMinutes(expiredMinutes);
            string content = TCommonUtils.ConvertToJsonStringify(data);

            await _redisDb.StringSetAsync(keyCache, content, _expired);
        }

        // Delete cached
        public async Task DeleteCachedAsync(string keyStoredManager)
        {
            await _redisDb.KeyDeleteAsync(keyStoredManager);
        }

        // this way was created to help us set of keys in one group but create another key same times
        public async Task SetOfCacheAsync<T>(string keyStoredManager, string keyCache, T data, int expiredMinutes = TConstValue.CACHE_EXPIRED_TIME)
        {

            TimeSpan _expired = TimeSpan.FromMinutes(expiredMinutes);

            await SetCacheAsync(keyCache, data, expiredMinutes);

            // add key to store manager
            await _redisDb.SetAddAsync(keyStoredManager, keyCache); // StringSetAsync(keyCache, content, _expired);
        }

        // -----------------------------------------------------
        // this way will group by all keys in one dictionary
        public async Task HashCacheAsync(string keyStoredManager, string keyCache, RedisValue data, int expiredMinutes = TConstValue.CACHE_EXPIRED_TIME)
        {
            TimeSpan _expired = TimeSpan.FromMinutes(expiredMinutes);

            HashEntry[] keyValuePair = new HashEntry[] {
                new HashEntry(keyCache, data)
            };

            await _redisDb.HashSetAsync(keyStoredManager, keyValuePair);

            // ⚠️ Redis không hỗ trợ TTL cho từng field, nên nếu bạn muốn expiry:
            // chỉ có thể đặt TTL cho toàn bộ hash
            await _redisDb.KeyExpireAsync(keyStoredManager, _expired);
        }

        public async Task<string> GetFieldOfHashCacheAsync(string keyStoredManager, string fieldKey)
        {
            var value = await _redisDb.HashGetAsync(keyStoredManager, fieldKey);
            return value.IsNullOrEmpty ? null : value.ToString();
        }
        public async Task DeleteFieldOfHashAsync(string keyStoredManager, string fieldKey)
        {
            await _redisDb.HashDeleteAsync(keyStoredManager, fieldKey);
        }
        // -----------------------------------------------------

        public async Task<T> GetCacheAsync<T>(string keyCache)
        {
            IDatabase redisDb = _connectionMultiplexer.GetDatabase();
            RedisValue content = await redisDb.StringGetAsync(keyCache);
            if (string.IsNullOrEmpty(content))
            {
                return default;
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
            string prefixKey = "";
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
                prefixKey = userId + "|";
            }

            string key = prefixKey + cacheKey + primaryKey;
            return key;
        }
    }
}
