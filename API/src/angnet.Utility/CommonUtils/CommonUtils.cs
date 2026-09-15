using angnet.Domain.Dtos;
using System.Globalization;
using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace angnet.Utility.CommonUtils
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
            // đ/Đ phải thay trước khi chuẩn hoá: trong Unicode chúng là ký tự riêng chứ
            // không phải "d + dấu", nên FormD không tách được và vòng lặp dưới giữ
            // nguyên chúng - sau đó GenerateSlug lại xoá thẳng vì không khớp [a-z0-9].
            // Hậu quả: "Hà Giang mang nét đẹp" ra slug "...mang-net-ep" (mất hẳn chữ).
            var normalizedString = txt
                .Replace('đ', 'd')
                .Replace('Đ', 'D')
                .Normalize(NormalizationForm.FormD);
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
            // 45 (giá trị cũ) cắt cụt gần như mọi tiêu đề tiếng Việt: "Vibe Coding là
            // gì? Nó đang thay đổi nghề lập trình ra sao?" chỉ còn tới "...nghe-lap",
            // mất hẳn từ khoá ở đuôi. 90 đủ giữ trọn tiêu đề dài nhất đang có mà URL
            // vẫn chưa tới mức Google phải cắt bớt khi hiển thị.
            // Không có ràng buộc độ dài nào ở DB - NewsId/Slug đều là text tự do.
            const int maxLength = 90;

            string str = RemoveAccent(phrase).ToLower();
            // invalid chars           
            str = Regex.Replace(str, @"[^a-z0-9\s-]", "");
            // convert multiple spaces into one space   
            str = Regex.Replace(str, @"\s+", " ").Trim();

            // Cắt theo ranh giới từ thay vì cắt cứng giữa chừng: cắt cứng sinh ra
            // những slug cụt nghĩa như "...cua-mie" (miền núi) - vừa xấu vừa mất
            // từ khoá. Nếu từ đầu tiên đã dài hơn maxLength thì đành cắt cứng.
            if (str.Length > maxLength)
            {
                int lastSpace = str.LastIndexOf(' ', maxLength);
                str = lastSpace > 0 ? str.Substring(0, lastSpace) : str.Substring(0, maxLength);
            }

            str = Regex.Replace(str.Trim(), @"\s", "-"); // hyphens   
            // Gộp gạch nối lặp (tiêu đề có sẵn "-") và bỏ gạch thừa ở hai đầu.
            str = Regex.Replace(str, @"-+", "-").Trim('-');
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

        public static bool IsDecimalType(object value)
        {
            return value is decimal;
        }

        public static decimal ConvertToDecimal(object value)
        {
            if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
            {
                return 0.00m;
            }

            if (decimal.TryParse(value.ToString(), out decimal result))
            {
                return Math.Round(result, 2); // Làm tròn đến 2 chữ số thập phân
            }

            return 0.00m;
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

        public static DateTime DTimeAddMinute(double m)
        {
            return DateTime.UtcNow.AddMinutes(m);
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

        // Count word HTML Body
        public static (int Minutes, int WordCount) CalculateReadingTime(string content)
        {
            if (string.IsNullOrWhiteSpace(content))
                return (0, 0);

            // Xóa HTML tags nếu có
            var textOnly = Regex.Replace(content, "<[^>]*>", string.Empty);

            // Đếm từ (hỗ trợ cả tiếng Việt)
            var wordCount = textOnly.Split(new[] { ' ', '\t', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries)
                                  .Count(word => word.Length > 1 || char.IsLetterOrDigit(word[0]));

            // Tính phút (200 từ/phút là tốc độ đọc trung bình)
            var minutes = (int)Math.Ceiling(wordCount / 200.0);

            return (minutes, wordCount);
        }

        // Email
        public static bool IsValidEmailStrict(string email)
        {
            string StrictEmailPattern = @"^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$";

            if (string.IsNullOrWhiteSpace(email))
                return false;

            // Kiểm tra độ dài
            if (email.Length > 254)
                return false;
            var regex = new Regex(StrictEmailPattern, RegexOptions.IgnoreCase);
            bool isValid = regex.IsMatch(email);
            return isValid;
        }

    }
}
