using Contacts.Maui.Models; 
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json ;
using System.Threading.Tasks;

namespace Contacts.Maui.ApiServices
{
    public class MstProvinceApiService
    {
        private string _accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InBoYW50aGFuZ0BnbWFpbC5jb20iLCJuYW1lIjoiUGhhbiBWxINuIFRoxINuZyIsIm5hbWVpZCI6Ijk5ODQxMzQ1LWVmYmItNGI0Ny1hZDNjLWNiNjBhZDczZTRlMCIsImF1ZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6NDIwMCIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6NTAwMCIsInJvbGUiOiJVc2VyIiwibmJmIjoxNzQyMzU4MjQ0LCJleHAiOjE3NDIzNTkxNDQsImlhdCI6MTc0MjM1ODI0NH0.F70PPgpEyPY-_ymO8DKulvq_a9gLHsD8uBlFM7rB1pQ";
        private HttpClient _httpClient;
        public MstProvinceApiService(HttpClient httpClient) { 
            _httpClient = httpClient;
            _httpClient.BaseAddress = new Uri("http://localhost:5000/api/MstProvince/");
        }

        public async Task<List<MstProvinceModel>> GetAllActive()
        {
            _httpClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", $"Bearer {this._accessToken}");
            var response = await _httpClient.GetAsync("GetAllActive");

            if(response.IsSuccessStatusCode == true)
            {
                string jsonData = await response.Content.ReadAsStringAsync();
                if(jsonData is not null)
                {
                    dynamic data = JsonSerializer.Deserialize<dynamic>(jsonData);
                    List <MstProvinceModel> dataProvices = data?.DataList ;
                    return data;
                }
            }

            return new List<MstProvinceModel>();
        }
    }
}
