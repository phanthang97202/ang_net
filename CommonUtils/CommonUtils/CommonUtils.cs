using SharedModels.Dtos;
using System.Globalization;
using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization.Metadata;
using System.Text.RegularExpressions;

namespace CommonUtils.CommonUtils
{
    public static class CommonUtils
    {
        public static List<RequestClient> GetKeyValuePairRequestClient(object data, ref List<RequestClient> requestClient)
        {
            if (data is null)
            {
                RequestClient rc = new RequestClient(data);
                requestClient.Add(null);
                return requestClient;
            }

            if (data.GetType() == typeof(string))
            {
                RequestClient rc = new RequestClient(data);
                requestClient.Add(rc);

                return requestClient;
            }

            PropertyInfo[] properties = data.GetType().GetProperties();

            foreach (PropertyInfo p in properties)
            {
                string key = p.Name;
                object value = p.GetValue(data);
                RequestClient rc = new RequestClient(key, value);
                requestClient.Add(rc);
            }

            return requestClient;
        }

        public static string GenUniqueId()
        {
            string uniqueId = Guid.NewGuid().ToString();
            return uniqueId;
        }

        public static bool IsNullOrEmpty(string value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return true;
            }
            else
            {
                return false;
            }
        }

        public static string PureString(string value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return "";
            }
            else
            {
                string pureString = value.Trim();
                return pureString;
            }
        }

        public static string ConvertLowerCase(string value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return "";
            }
            else
            {
                string lowerStr = value.Trim().ToLower();
                return lowerStr;
            }
        }

        public static string RemoveAccent(string txt)
        {
            var normalizedString = txt.Normalize(NormalizationForm.FormD);
            var stringBuilder = new StringBuilder();

            foreach (var c in normalizedString)
            {
                var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != UnicodeCategory.NonSpacingMark)
                {
                    stringBuilder.Append(c);
                }
            }

            return stringBuilder.ToString().Normalize(NormalizationForm.FormC);
        }

        public static string GenerateSlug(string phrase)
        {
            string str = RemoveAccent(phrase).ToLower();
            // invalid chars           
            str = Regex.Replace(str, @"[^a-z0-9\s-]", "");
            // convert multiple spaces into one space   
            str = Regex.Replace(str, @"\s+", " ").Trim();
            // cut and trim 
            str = str.Substring(0, str.Length <= 45 ? str.Length : 45).Trim();
            str = Regex.Replace(str, @"\s", "-"); // hyphens   
            return str;
        }

        public static string ConvertObjectToString(object value)
        {
            if (value == null || value == DBNull.Value)
            {
                return "";
            }
            else
            {
                return value.ToString()!;
            }
        }

        public static int CeilingValue(int value)
        {
            if (value % 10 > 0)
            {
                return value + 1;
            }
            else
            {
                return value;
            }
        }

        public static bool IsDoubleType(object value)
        {
            if (value is double)
            {
                return true;
            }
            else
            {
                return false;
            }
        }

        public static double ConvertToDouble(object value)
        {
            if (value == null || value.ToString().Trim() == "")
            {
                return 0.00;
            }

            if (double.TryParse(value.ToString(), out double result))
            {
                return Math.Round(result, 2); // Round to 2 decimal places
            }

            // If parsing fails, return 0
            return 0.00;
        }

        public static int ConvertToInt(string input, int defaultValue = 0)
        {
            return int.TryParse(input, out int result) ? result : defaultValue;
        }

        // Json 
        public static string ConvertToJsonStringify<T>(T data)
        {
            string content = JsonSerializer.Serialize(data, new JsonSerializerOptions
            {
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping, // giữ nguyên UTF8
            });
            return content;
        }
        
        public static T? ParseJsonStringify<T>(string data)
        {

            if (string.IsNullOrWhiteSpace(data))
            {
                return default(T); // Returns null for reference types, 0/false for value types
            }

            try
            {
                return JsonSerializer.Deserialize<T>(data);
            }
            catch (JsonException ex)
            {
                Console.WriteLine($"JSON deserialization error: {ex.Message}");
                return default(T);
            }

        }
        // DateTime

        public static DateTime DTimeNow()
        {
            return DateTime.UtcNow;
        }


        public static DateTime DTimeAddDay(double days)
        {
            return DateTime.UtcNow.AddDays(days);
        }

        // HttpClient
        public static StringContent GetContent(object dado)
        {
            return new StringContent(
                ConvertToJsonStringify(dado),
                Encoding.UTF8,
                "application/json");
        }

        // RedisCache
        public static string GenerateUniqueCacheKey(string userId, string keyCache,string primaryKeyRecord)
        {
            string val = $"{userId}.{keyCache}.{primaryKeyRecord}";
            return val;
        }
    }
}
