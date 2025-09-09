using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace angnet.Application.Interfaces.Services
{
    public interface ITenantService
    {
        public ApiResponse<TenantModel> Search(int pageIndex, int pageSize, string keyword);
        public Task<ApiResponse<TenantModel>> Detail(string key);
        public Task<ApiResponse<TenantModel>> Create(TenantModel data);
        public Task<ApiResponse<TenantUpdateDto>> Update(TenantUpdateDto data);
        public Task<ApiResponse<TenantModel>> Delete(string ProvinceCode);
        public Task<ApiResponse<TenantModel>> GetAllActive(); 
    }
}
