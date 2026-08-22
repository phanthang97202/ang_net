using angnet.Application.Interfaces.Repositories;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Http;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;

namespace angnet.Infrastructure.Data.Repositories
{
    public class SysParameterRespository : BaseRepository<SysParameterModel>, ISysParameterRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        public SysParameterRespository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor) : base(appDbContext, httpContextAccessor)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
        }

        public (List<SysParameterModel> Data, int TotalCount) Search(
                                                                                int pageIndex
                                                                                , int pageSize
                                                                                , string keyword
                                                                                , string category
        )
        {
            IQueryable<SysParameterModel> query = _dbContext.SysParameter
                                    .Where(p => !TCommonUtils.IsNullOrEmpty(keyword)
                                                    ? p.ParameterCode.Contains(keyword)
                                                      || p.ParameterNameVi.Contains(keyword)
                                                      || p.ParameterNameEn.Contains(keyword)
                                                    : true)
                                    .Where(p => !TCommonUtils.IsNullOrEmpty(category) ? p.Category == category : true);

            int itemCount = query.Count();

            // Sắp xếp cố định để phân trang không bị nhảy dòng giữa các lần gọi
            List<SysParameterModel> dataResult = query.OrderBy(p => p.Category)
                                                      .ThenBy(p => p.SortOrder)
                                                      .ThenBy(p => p.ParameterCode)
                                                      .Skip(pageIndex * pageSize)
                                                      .Take(pageSize)
                                                      .ToList();

            return (dataResult, itemCount);
        }
    }
}
