using API.Models;

namespace API.Interfaces
{
    public interface IMstProvinceRespository
    {
        public Task<List<MstProvinceModel>> GetAllActive();
        public Task<bool> Create(MstProvinceModel data);
        public Task<bool> Delete(string id);
        public Task<bool> Update(MstProvinceModel data);
        public Task<bool> ImportExcel(IFormFile file);
    }
}