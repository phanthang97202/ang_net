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
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;

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

        public (List<NewsCategoryModel> Data, int TotalCount) Search(int pageIndex, int pageSize, string keyword)
        {
            IQueryable<NewsCategoryModel> query = _dbContext.NewsCategory
                                    .Where(p => !TCommonUtils.IsNullOrEmpty(keyword)
                                                    ? p.NewsCategoryId.Contains(keyword)
                                                      || p.NewsCategoryName.Contains(keyword)
                                                    : true);

            int itemCount = query.Count();

            // Sắp xếp cố định để phân trang không bị nhảy dòng giữa các lần gọi
            List<NewsCategoryModel> dataResult = query.OrderBy(p => p.NewsCategoryIndex)
                                                      .ThenBy(p => p.NewsCategoryId)
                                                      .Skip(pageIndex * pageSize)
                                                      .Take(pageSize)
                                                      .ToList();

            return (dataResult, itemCount);
        }
    }
}
