using API.Dtos;
using API.Models;

namespace API.IRespositories
{
    public interface IMstStadiumStatusRespository
    {
        Task<ApiResponse<MstStadiumStatusModel>> GetAllStadiumStatus();
    }
}
