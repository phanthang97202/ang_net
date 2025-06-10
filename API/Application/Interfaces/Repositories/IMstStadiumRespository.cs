using SharedModels.Dtos;
using SharedModels.Models;

namespace API.Application.Interfaces.Repositories
{
    public interface IMstStadiumRespository
    {
        Task<ApiResponse<MstStadiumModel>> GetAllActive();
    }
}
