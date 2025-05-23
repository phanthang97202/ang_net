﻿using SharedModels.Dtos;
using SharedModels.Models;
using API.Interfaces;

namespace API.UnitOfWork.Services
{
    public class MstStadiumStatusService
    {
        private readonly IUnitOfWork _unitOfWork;
        public MstStadiumStatusService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        // GetAllStadiumStatus
        public async Task<ApiResponse<MstStadiumStatusModel>> GetAllStadiumStatus()
        {
            return await _unitOfWork.MstStadiumStatusRespository.GetAllStadiumStatus();
        }

        // Update
        // _unitOfWork.SaveChangesAsync();

        // Create
        // _unitOfWork.SaveChangesAsync();

    }
}
