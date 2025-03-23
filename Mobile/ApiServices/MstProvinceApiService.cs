//using Angnet.Maui.Models; 
using System;
using SharedModels.Dtos;
using SharedModels.Models;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json ;
using System.Threading.Tasks; 
using System.Net.Http.Headers;

namespace Angnet.Maui.ApiServices
{
    public class MstProvinceApiService
    {
        private string _accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InBoYW50aGFuZ0BnbWFpbC5jb20iLCJuYW1lIjoiUGhhbiBWxINuIFRoxINuZyIsIm5hbWVpZCI6Ijk5ODQxMzQ1LWVmYmItNGI0Ny1hZDNjLWNiNjBhZDczZTRlMCIsImF1ZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6NDIwMCIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6NTAwMCIsInJvbGUiOiJVc2VyIiwibmJmIjoxNzQyNzQ0MDkyLCJleHAiOjE3NDI3ODcyOTIsImlhdCI6MTc0Mjc0NDA5Mn0.1lr_TganINdu-wKuohbaXIsAsMLe1TwxDcZ1S09Gmvg";
        private HttpClient _httpClient;
        public MstProvinceApiService(HttpClient httpClient) { 
            _httpClient = httpClient;
            _httpClient.BaseAddress = new Uri("http://localhost:5000/api/MstProvince/");
        }

        public async Task<List<MstProvinceModel>> GetAllActive()
        {
            // _httpClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", $"Bearer {this._accessToken}");
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", this._accessToken);
            var response = await _httpClient.GetAsync("GetAllActive");

            if(response.IsSuccessStatusCode == true)
            {
                string jsonData = await response.Content.ReadAsStringAsync();
                if(jsonData is not null)
                {
                    dynamic data = JsonSerializer.Deserialize<ApiResponse<MstProvinceModel>>(jsonData);
                    List <MstProvinceModel> result = data?.DataList;
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
    }
}
