using API.Dtos;
using API.Models;

namespace API.Interfaces
{
    public interface IMstProvinceRespository
    {
        public Task<List<MstProvinceModel>> GetAllActive();
        public Task<ApiResponse<MstProvinceModel>> Create(MstProvinceModel data);
        public Task<bool> Delete(string id);
        public Task<ApiResponse<MstProvinceModel>> Update(MstProvinceModel data);
        public Task<bool> ImportExcel(IFormFile file);
        public Task<byte[]> ExportExcel();
    }
}