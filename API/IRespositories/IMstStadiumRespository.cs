using SharedModels.Dtos;
using SharedModels.Models;

namespace API.IRespositories
{
    public interface IMstStadiumRespository
    {
        Task<ApiResponse<MstStadiumModel>> GetAllActive();
    }
}
