using angnet.Application.Interfaces.Repositories;
using angnet.Domain.Models;
using angnet.Utility.CommonUtils;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.NetworkInformation;
using System.Text;
using System.Threading.Tasks;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;

namespace angnet.Infrastructure.Data.Repositories
{
    public class TenantRepository : BaseRepository<TenantModel>, ITenantRepository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        public TenantRepository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor) : base(appDbContext, httpContextAccessor)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
        }

        public (List<TenantModel> Data, int TotalCount) Search(
                                                                int pageIndex
                                                                , int pageSize
                                                                , string keyword
        )
        {
            List<TenantModel> dataResult = new List<TenantModel>();
            IQueryable<TenantModel> query = _dbContext.Tenants
                                    .Where(p => !TCommonUtils.IsNullOrEmpty(keyword) ? p.TenantName.Contains(keyword) 
                                    || p.TenantCode == keyword : true);

            int itemCount = query.ToList().Count;

            dataResult = query.Skip(pageIndex * pageIndex)
                             .Take(pageSize)
                             .ToList();

            return (dataResult, itemCount);
        }
    } 
}
