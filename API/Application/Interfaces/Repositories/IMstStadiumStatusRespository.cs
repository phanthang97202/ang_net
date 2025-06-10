using SharedModels.Dtos;
using SharedModels.Models;
namespace API.Application.Interfaces.Repositories
{
    public interface IMstStadiumStatusRespository
    {
        Task<ApiResponse<MstStadiumStatusModel>> GetAllStadiumStatus();
    }
}
