﻿using SharedModels.Dtos;
using SharedModels.Models;
using API.Interfaces;

namespace API.UnitOfWork.Services
{
    public class MstStadiumService
    {
        private readonly IUnitOfWork _unitOfWork;
        public MstStadiumService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        // GetAllStadium
        public async Task<ApiResponse<MstStadiumModel>> GetAllActive()
        {
            return await _unitOfWork.MstStadiumRespository.GetAllActive();
        }

        // Update
        // _unitOfWork.SaveChangesAsync();

        // Create
        // _unitOfWork.SaveChangesAsync();
    }
}
