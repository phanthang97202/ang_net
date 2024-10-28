using API.Dtos;
using API.Models;

namespace API.Interfaces
{
    public interface IMstProvinceRespository
    {
        public Task<ApiResponse<MstProvinceModel>> Search(int pageIndex, int pageSize, string keyword);
        public Task<ApiResponse<MstProvinceModel>> Detail(string key);
        public Task<ApiResponse<MstProvinceModel>> GetAllActive();
        public Task<ApiResponse<MstProvinceModel>> Create(MstProvinceModel data);
        public Task<ApiResponse<MstProvinceModel>> Delete(string id);
        public Task<ApiResponse<MstProvinceModel>> Update(MstProvinceModel data);
        public Task<ApiResponse<MstProvinceModel>> ImportExcel(IFormFile file);
        public Task<byte[]> ExportExcel();
    }
}