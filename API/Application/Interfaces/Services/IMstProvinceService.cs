using SharedModels.Dtos;
using SharedModels.Models;

namespace API.Application.Interfaces.Services
{
    public interface IMstProvinceService
    {
        public ApiResponse<MstProvinceModel> Search(int pageIndex, int pageSize, string keyword);
        public Task<ApiResponse<MstProvinceModel>> Detail(string key);
        public Task<ApiResponse<MstProvinceTestDto>> Create(MstProvinceTestDto data);
        public Task<ApiResponse<MstProvinceModel>> Update(MstProvinceModel data);
        public Task<ApiResponse<MstProvinceModel>> Delete(string ProvinceCode);
        public Task<ApiResponse<MstProvinceModel>> GetAllActive();
        public Task<ApiResponse<MstProvinceModel>> ImportExcel(IFormFile file);
        public Task<byte[]> ExportExcel();
        public byte[] ExportTemplate();

    }
}
