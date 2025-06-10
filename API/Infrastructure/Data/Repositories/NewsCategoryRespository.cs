using SharedModels.Dtos;
using SharedModels.Models;
using Microsoft.EntityFrameworkCore;
using GuardAuth = API.Shared.Utilities.CheckAuthorized;
using API.Application.Interfaces.Repositories;
using API.Infrastructure.Data;

namespace API.Infrastructure.Data.Repositories
{
    public class NewsCategoryRespository : INewsCategoryRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        public NewsCategoryRespository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<ApiResponse<NewsCategoryDto>> GetAllActive()
        {
            ApiResponse<NewsCategoryDto> apiResponse = new ApiResponse<NewsCategoryDto>();
            List<RequestClient> requestClient = new List<RequestClient>();

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            List<NewsCategoryDto> data = await _dbContext.NewsCategory
                                                .Where(i => i.FlagActive == true)
                                                .Select(i =>
                                                    new NewsCategoryDto
                                                    {
                                                        NewsCategoryId = i.NewsCategoryId,
                                                        NewsCategoryParentId = i.NewsCategoryParentId,
                                                        NewsCategoryName = i.NewsCategoryName,
                                                        NewsCategoryIndex = i.NewsCategoryIndex,
                                                    })
                                                .OrderBy(i => i.NewsCategoryIndex)
                                                .ToListAsync();

            apiResponse.DataList = data;

            return apiResponse;
        }
    }
}
