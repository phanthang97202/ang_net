using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.EntityFrameworkCore;
using GuardAuth = angnet.Utility.CommonUtils.CheckAuthorized;
using angnet.Application.Interfaces.Repositories;
using angnet.Infrastructure.Data;
using static Dapper.SqlMapper;
using System.Linq.Expressions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace angnet.Infrastructure.Data.Repositories
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
