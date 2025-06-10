using SharedModels.Dtos;
using SharedModels.Models;
using API.Application.Interfaces.Persistences;

namespace API.Infrastructure.Data.Services
{
    public class MstDistrictService
    {
        private readonly IUnitOfWork _unitOfWork;
        public MstDistrictService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        // GetAllStadium
        public async Task<ApiResponse<MstDistrictModel>> GetAllActive()
        {
            return await _unitOfWork.MstDistrictRespository.GetAllActive();
        }

        // Update
        // _unitOfWork.SaveChangesAsync();

        // Create
        public async Task<ApiResponse<MstDistrictModel>> Create(MstDistrictModel data)
        {
            ApiResponse<MstDistrictModel> response = await _unitOfWork.MstDistrictRespository.Create(data);
            await _unitOfWork.SaveChangesAsync();
            return response;

        }
    }
}
