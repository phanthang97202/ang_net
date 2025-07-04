﻿using SharedModels.Dtos;
using SharedModels.Models;
using GuardAuth = API.Shared.Utilities.CheckAuthorized;
using TConstValue = CommonUtils.CommonUtils.ConstValue;
using Microsoft.EntityFrameworkCore;
using API.Application.Interfaces.Repositories;
using API.Infrastructure.Data;

namespace API.Infrastructure.Data.Repositories
{
    public class HashTagNewsRespository : IHashTagNewsRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        public HashTagNewsRespository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ApiResponse<HashTagNewsModel>> GetTopHashTag()
        {
            ApiResponse<HashTagNewsModel> apiResponse = new ApiResponse<HashTagNewsModel>();
            List<RequestClient> requestClient = new List<RequestClient>();

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            //bool isAuthorized = GuardAuth.IsAuthorized(token);
            //if (!isAuthorized)
            //{
            //    apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
            //    return apiResponse;
            //}

            List<HashTagNewsModel> data = await _dbContext.HashTagNews
                .Select(i =>
                    new HashTagNewsModel
                    {
                        HashTagNewsId = i.HashTagNewsId,
                        HashTagNewsName = i.HashTagNewsName,
                        NewsId = i.NewsId,
                        Count = i.Count,
                        CreatedDTime = i.CreatedDTime,
                        UpdatedDTime = i.UpdatedDTime,
                    })
                .OrderByDescending(i => i.Count)
                .Take(TConstValue.MAX_TOP_HASHTAGNEWS)
                .ToListAsync();

            apiResponse.DataList = data;

            return apiResponse;
        }
    }
}
