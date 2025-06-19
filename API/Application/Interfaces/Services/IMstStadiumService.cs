using SharedModels.Dtos;
using SharedModels.Models;

namespace API.Application.Interfaces.Services
{
    public interface IMstStadiumService
    {
        public Task<ApiResponse<MstStadiumModel>> Create(MstStadiumModel data);
        public Task<ApiResponse<MstStadiumModel>> GetAllActive();
    }
}
