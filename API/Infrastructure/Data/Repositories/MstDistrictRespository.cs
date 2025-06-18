using API.Application.Interfaces.Repositories;
using ClosedXML.Excel;
using ExcelDataReader;
using Microsoft.EntityFrameworkCore;
using SharedModels.Dtos;
using SharedModels.Models;
using System.Data;
using System.Reflection;
using System.Text.Json;
using GuardAuth = API.Shared.Utilities.CheckAuthorized;
using TCommonUtils = CommonUtils.CommonUtils.CommonUtils;

namespace API.Infrastructure.Data.Repositories
{
    public class MstDistrictRespository : BaseRepository<MstDistrictModel>, IMstDistrictRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        public MstDistrictRespository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor) : base(appDbContext)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<(List<MstDistrictModel> Data, int TotalCount)> Search(
                                                                                int pageIndex
                                                                                , int pageSize
                                                                                , string keyword
        )
        { 
            List<MstDistrictModel> dataResult = new List<MstDistrictModel>();

            IQueryable<MstDistrictModel> query = _dbContext.MstDistricts
                                    .Where(p => !TCommonUtils.IsNullOrEmpty(keyword) ? p.DistrictName.Contains(keyword) || p.DistrictCode == keyword : true);

            int itemCount = query.ToList().Count;

            dataResult = query.Skip(pageIndex * pageIndex)
                             .Take(pageSize)
                             .ToList();

            return (dataResult, itemCount);
        } 
    }
}