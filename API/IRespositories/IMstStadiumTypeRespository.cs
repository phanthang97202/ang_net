using SharedModels.Dtos;
using SharedModels.Models;

namespace API.IRespositories
{
    public interface IMstStadiumTypeRespository
    {
        Task<ApiResponse<MstStadiumTypeModel>> GetAllStadiumType();
    }
}
