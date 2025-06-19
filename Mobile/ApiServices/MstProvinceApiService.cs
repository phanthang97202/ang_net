//using Angnet.Maui.Models; 
using SharedModels.Dtos;
using SharedModels.Models;
using System.Net.Http.Headers;
using System.Text.Json;
using TCommonUtil = CommonUtils.CommonUtils.CommonUtils;

namespace Angnet.Maui.ApiServices
{
    public class MstProvinceApiService
    {
        private string _accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsIm5hbWUiOiJBZG1pbiIsIm5hbWVpZCI6IjlhNTRkMTRlLTU2NjctNDFmMS1hYzUwLTEwNWZiMDgyMDgyNSIsImF1ZCI6Imh0dHBzOi8vYW5nLW5ldC5vbnJlbmRlci5jb20iLCJpc3MiOiJodHRwczovL2FuZy1uZXQub25yZW5kZXIuY29tIiwicm9sZSI6WyJVc2VyIiwiQWRtaW4iXSwibmJmIjoxNzQ3MTI1NjkwLCJleHAiOjE3NDcxNjg4OTAsImlhdCI6MTc0NzEyNTY5MH0.TZ6Wo3mdaUFc8ZyyD9x9z4nBl-NoOpLK-UYQQ-QPBYk";
        private HttpClient _httpClient;
        public MstProvinceApiService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _httpClient.BaseAddress = new Uri("https://ang-net.onrender.com/api/MstProvince/");
        }

        public async Task<List<MstProvinceModel>> GetAllActive()
        {
            // _httpClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", $"Bearer {this._accessToken}");
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", this._accessToken);
            var response = await _httpClient.GetAsync("GetAllActive");

            if (response.IsSuccessStatusCode == true)
            {
                string jsonData = await response.Content.ReadAsStringAsync();
                if (jsonData is not null)
                {
                    dynamic data = JsonSerializer.Deserialize<ApiResponse<MstProvinceModel>>(jsonData);
                    List<MstProvinceModel> result = data?.DataList;
                    return result;
                }
            }

            return new List<MstProvinceModel>();
        }

        public async Task<MstProvinceModel> GetByCode(string code)
        {
            // _httpClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", $"Bearer {this._accessToken}");
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", this._accessToken);


            var response = await _httpClient.GetAsync($"Detail?key={code}");

            if (response.IsSuccessStatusCode == true)
            {
                string jsonData = await response.Content.ReadAsStringAsync();
                if (jsonData is not null)
                {
                    dynamic data = JsonSerializer.Deserialize<ApiResponse<MstProvinceModel>>(jsonData);
                    MstProvinceModel result = data?.Data;
                    return result;
                }
            }

            return new MstProvinceModel();
        }

        public async Task<ApiResponse<MstProvinceModel>> Create(MstProvinceModel province)
        {
            // _httpClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", $"Bearer {this._accessToken}");
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", this._accessToken);

            var response = await _httpClient.PostAsync($"Create", TCommonUtil.GetContent(province));

            return new ApiResponse<MstProvinceModel>();
        }

        public async Task<ApiResponse<MstProvinceModel>> Update(MstProvinceModel province)
        {
            // _httpClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", $"Bearer {this._accessToken}");
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", this._accessToken);

            var response = await _httpClient.PatchAsync($"Update", TCommonUtil.GetContent(province));

            return new ApiResponse<MstProvinceModel>();
        }

        public async Task<ApiResponse<MstProvinceModel>> Delete(string code)
        {
            // _httpClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", $"Bearer {this._accessToken}");
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", this._accessToken);

            var response = await _httpClient.DeleteAsync($"Delete?ProvinceCode={code}");

            return new ApiResponse<MstProvinceModel>();
        }
    }
}
