using API.Dtos;
using API.Models;

namespace API.IRespositories
{
    public interface IMstStadiumTypeRespository
    {
        Task<ApiResponse<MstStadiumTypeModel>> GetAllStadiumType();
    }
}
