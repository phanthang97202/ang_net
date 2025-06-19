using SharedModels.Dtos;
using SharedModels.Models;
using Microsoft.EntityFrameworkCore;
using GuardAuth = API.Shared.Utilities.CheckAuthorized;
using API.Application.Interfaces.Repositories;
using API.Infrastructure.Data;
using static Dapper.SqlMapper;
using System.Linq.Expressions;

namespace API.Infrastructure.Data.Repositories
{
    public class NewsCategoryRespository : BaseRepository<NewsCategoryModel>, INewsCategoryRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        public NewsCategoryRespository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor) : base(appDbContext, httpContextAccessor)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<List<NewsCategoryDto>> GetAllNewCategory()
        {
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

            return data;
        }
    }
}
