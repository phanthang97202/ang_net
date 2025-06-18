using SharedModels.Models;
using SharedModels.Dtos;

namespace API.Application.Interfaces.Services
{
    public interface IMstDistrictService
    {
        public Task<ApiResponse<MstDistrictModel>> Search(int pageIndex, int pageSize, string keyword);
        public Task<ApiResponse<MstDistrictModel>> Detail(string key);
        public Task<ApiResponse<MstDistrictModel>> Create(MstDistrictModel data);
        public Task<ApiResponse<MstDistrictModel>> Update(MstDistrictModel data);
        public Task<ApiResponse<MstDistrictModel>> Delete(string ProvinceCode);
        public Task<ApiResponse<MstDistrictModel>> GetAllActive();
        public Task<ApiResponse<MstDistrictModel>> ImportExcel(IFormFile file);
        public Task<byte[]> ExportExcel();
        public Task<byte[]> ExportTemplate();
    }
}
