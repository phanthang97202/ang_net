using SharedModels.Dtos;
using SharedModels.Models;

namespace API.Application.Interfaces.Repositories
{
    public interface IMstStadiumTypeRespository
    {
        Task<ApiResponse<MstStadiumTypeModel>> GetAllStadiumType();
    }
}
