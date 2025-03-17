using API.Dtos;
using API.Models;

namespace API.IRespositories
{
    public interface IMstStadiumRespository
    {
        Task<ApiResponse<MstStadiumModel>> GetAllActive();
    }
}
