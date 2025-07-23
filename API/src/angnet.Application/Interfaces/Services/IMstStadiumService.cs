using angnet.Domain.Dtos;
using angnet.Domain.Models;

namespace angnet.Application.Interfaces.Services
{
    public interface IMstStadiumService
    {
        public Task<ApiResponse<MstStadiumModel>> Create(MstStadiumModel data);
        public Task<ApiResponse<MstStadiumModel>> GetAllActive();
    }
}
