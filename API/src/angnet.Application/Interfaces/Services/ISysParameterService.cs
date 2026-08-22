using angnet.Domain.Dtos;
using angnet.Domain.Models;

namespace angnet.Application.Interfaces.Services
{
    public interface ISysParameterService
    {
        public ApiResponse<SysParameterModel> Search(int pageIndex, int pageSize, string keyword, string category);
        public Task<ApiResponse<SysParameterModel>> Detail(string key);
        public Task<ApiResponse<SysParameterModel>> Create(SysParameterModel data);
        public Task<ApiResponse<SysParameterModel>> Update(SysParameterModel data);
        public Task<ApiResponse<SysParameterModel>> Delete(string ParameterCode);
        public Task<ApiResponse<SysParameterModel>> GetAllActive();
    }
}
