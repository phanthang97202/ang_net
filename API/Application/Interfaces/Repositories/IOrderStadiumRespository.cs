﻿using SharedModels.Dtos;
using SharedModels.Models;
using System.Security.Claims;

namespace API.Application.Interfaces.Repositories
{
    public interface IOrderStadiumRespository
    {
        public Task<ApiResponse<RPNewsDto>> Search(int pageIndex, int pageSize, string keyword);
        public Task<ApiResponse<RPNewsDto>> Detail(string newsId);
        public Task<ApiResponse<NewsModel>> Create(ClaimsPrincipal User, NewsDto data);
        public Task<ApiResponse<NewsModel>> Update(ClaimsPrincipal User, NewsDto data);
    }
}
