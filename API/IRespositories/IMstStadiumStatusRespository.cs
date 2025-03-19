using SharedModels.Dtos;
using SharedModels.Models;
namespace API.IRespositories
{
    public interface IMstStadiumStatusRespository
    {
        Task<ApiResponse<MstStadiumStatusModel>> GetAllStadiumStatus();
    }
}
