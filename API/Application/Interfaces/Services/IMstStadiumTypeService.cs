using SharedModels.Dtos;
using SharedModels.Models;

namespace API.Application.Interfaces.Services
{
    public interface IMstStadiumTypeService
    {
        public Task<ApiResponse<MstStadiumTypeModel>> Search(int pageIndex, int pageSize, string keyword);
        public Task<ApiResponse<MstStadiumTypeModel>> Detail(string key);
        public Task<ApiResponse<MstStadiumTypeModel>> Create(MstStadiumTypeModel data);
        public Task<ApiResponse<MstStadiumTypeModel>> Update(MstStadiumTypeModel data);
        public Task<ApiResponse<MstStadiumTypeModel>> Delete(string ProvinceCode);
        public Task<ApiResponse<MstStadiumTypeModel>> GetAllActive();
        public Task<ApiResponse<MstStadiumTypeModel>> ImportExcel(IFormFile file);
        public Task<byte[]> ExportExcel();
        public Task<byte[]> ExportTemplate();
    }
}
