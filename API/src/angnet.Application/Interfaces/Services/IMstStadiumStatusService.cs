using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Http;

namespace angnet.Application.Interfaces.Services
{
    public interface IMstStadiumStatusService
    {
        public Task<ApiResponse<MstStadiumStatusModel>> Search(int pageIndex, int pageSize, string keyword);
        public Task<ApiResponse<MstStadiumStatusModel>> Detail(string key);
        public Task<ApiResponse<MstStadiumStatusModel>> Create(MstStadiumStatusModel data);
        public Task<ApiResponse<MstStadiumStatusModel>> Update(MstStadiumStatusModel data);
        public Task<ApiResponse<MstStadiumStatusModel>> Delete(string ProvinceCode);
        public Task<ApiResponse<MstStadiumStatusModel>> GetAllActive();
        public Task<ApiResponse<MstStadiumStatusModel>> ImportExcel(IFormFile file);
        public Task<byte[]> ExportExcel();
        public Task<byte[]> ExportTemplate();
    }
}
