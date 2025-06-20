using API.Application.Interfaces.Repositories;
using API.Infrastructure.Data;
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
    public class MstProvinceRespository : BaseRepository<MstProvinceModel>, IMstProvinceRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        public MstProvinceRespository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor) : base(appDbContext, httpContextAccessor)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
        }

        public (List<MstProvinceModel> Data, int TotalCount) Search(
                                                                                int pageIndex
                                                                                , int pageSize
                                                                                , string keyword
        )
        { 
            List<MstProvinceModel> dataResult = new List<MstProvinceModel>();

            IQueryable<MstProvinceModel> query = _dbContext.MstProvinces
                                    .Where(p => !TCommonUtils.IsNullOrEmpty(keyword) ? p.ProvinceName.Contains(keyword) || p.ProvinceCode == keyword : true);
            
            int itemCount = query.ToList().Count;

            dataResult = query.Skip(pageIndex * pageIndex)
                             .Take(pageSize)
                             .ToList();

            return (dataResult, itemCount);
        }
    }
}