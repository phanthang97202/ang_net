using SharedModels.Dtos;
using SharedModels.Models;

namespace API.IRespositories
{
    public interface IMstDistrictRespository
    {
        public Task<ApiResponse<MstDistrictModel>> Search(int pageIndex, int pageSize, string keyword);
        public Task<ApiResponse<MstDistrictModel>> Detail(string key);
        public Task<ApiResponse<MstDistrictModel>> GetAllActive();
        public Task<ApiResponse<MstDistrictModel>> Create(MstDistrictModel data);
        public Task<ApiResponse<MstDistrictModel>> Delete(string id);
        public Task<ApiResponse<MstDistrictModel>> Update(MstDistrictModel data);
        public Task<byte[]> ExportTemplate();
        public Task<ApiResponse<MstDistrictModel>> ImportExcel(IFormFile file);
        public Task<byte[]> ExportExcel();
    }
}
