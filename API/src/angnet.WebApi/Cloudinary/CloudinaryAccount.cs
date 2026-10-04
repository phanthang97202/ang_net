using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace angnet.WebApi.Cloudinary
{
    /// <summary>
    /// Phần dùng chung khi gọi Cloudinary bằng API key/secret của server:
    /// đọc cấu hình, ký tham số, và client Admin API. Dùng bởi MediaController
    /// (thư viện media của admin) và ArchiveController (thư viện lưu trữ cá nhân).
    /// </summary>
    public static class CloudinaryAccount
    {
        public static bool TryGetSettings(
            IConfiguration configuration, out string cloudName, out string apiKey, out string apiSecret)
        {
            cloudName = configuration["Cloudinary:CloudName"] ?? string.Empty;
            apiKey = configuration["Cloudinary:ApiKey"] ?? string.Empty;
            apiSecret = configuration["Cloudinary:ApiSecret"] ?? string.Empty;

            // Cloudinary/Render thường cung cấp một biến duy nhất dạng
            // cloudinary://api_key:api_secret@cloud_name. Vẫn ưu tiên ba biến tách
            // riêng ở trên để dễ cấu hình trên máy phát triển.
            string cloudinaryUrl = configuration["CLOUDINARY_URL"] ?? string.Empty;
            if ((string.IsNullOrWhiteSpace(cloudName) ||
                 string.IsNullOrWhiteSpace(apiKey) ||
                 string.IsNullOrWhiteSpace(apiSecret)) &&
                Uri.TryCreate(cloudinaryUrl, UriKind.Absolute, out Uri? uri) &&
                uri.Scheme.Equals("cloudinary", StringComparison.OrdinalIgnoreCase))
            {
                string[] credentials = uri.UserInfo.Split(':', 2);
                if (credentials.Length == 2)
                {
                    apiKey = Uri.UnescapeDataString(credentials[0]);
                    apiSecret = Uri.UnescapeDataString(credentials[1]);
                    cloudName = uri.Host;
                }
            }

            return !string.IsNullOrWhiteSpace(cloudName) &&
                   !string.IsNullOrWhiteSpace(apiKey) &&
                   !string.IsNullOrWhiteSpace(apiSecret);
        }

        public static HttpClient CreateAdminClient(IHttpClientFactory httpClientFactory, string apiKey, string apiSecret)
        {
            HttpClient client = httpClientFactory.CreateClient();
            string credential = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{apiKey}:{apiSecret}"));
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credential);
            return client;
        }

        public static async Task<bool> UsesDynamicFolders(HttpClient client, string cloudName)
        {
            using HttpResponseMessage response = await client.GetAsync(
                $"https://api.cloudinary.com/v1_1/{Uri.EscapeDataString(cloudName)}/config?settings=true");
            if (!response.IsSuccessStatusCode)
            {
                // New Cloudinary environments use dynamic folders. Keep that as the safe fallback
                // if this account cannot expose its configuration through the Admin API.
                return true;
            }

            string json = await response.Content.ReadAsStringAsync();
            using JsonDocument document = JsonDocument.Parse(json);
            if (document.RootElement.TryGetProperty("settings", out JsonElement settings) &&
                settings.TryGetProperty("folder_mode", out JsonElement folderMode) &&
                folderMode.ValueKind == JsonValueKind.String)
            {
                return !string.Equals(folderMode.GetString(), "fixed", StringComparison.OrdinalIgnoreCase);
            }

            return true;
        }

        /// <summary>
        /// Ký chuỗi tham số đã sắp xếp theo alphabet dạng "a=1&amp;b=2" (không gồm
        /// file, api_key, resource_type) theo chuẩn SHA-1 của Cloudinary.
        /// </summary>
        public static string Sign(string parameters, string apiSecret)
        {
            byte[] hash = SHA1.HashData(Encoding.UTF8.GetBytes(parameters + apiSecret));
            return Convert.ToHexString(hash).ToLowerInvariant();
        }
    }
}
