﻿using SharedModels.Dtos;
using SharedModels.Models;
using API.Interfaces;

namespace API.UnitOfWork.Services
{
    public class MstStadiumTypeService
    {
        private readonly IUnitOfWork _unitOfWork;
        public MstStadiumTypeService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        // GetAllStadiumType
        public async Task<ApiResponse<MstStadiumTypeModel>> GetAllStadiumType()
        {
            return await _unitOfWork.MstStadiumTypeRespository.GetAllStadiumType();
        }

        // Update
        // _unitOfWork.SaveChangesAsync();

        // Create
        // _unitOfWork.SaveChangesAsync();
    }
}
