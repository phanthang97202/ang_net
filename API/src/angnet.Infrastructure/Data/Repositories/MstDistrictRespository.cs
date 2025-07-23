using angnet.Application.Interfaces.Repositories;
using ClosedXML.Excel;
using ExcelDataReader;
using Microsoft.EntityFrameworkCore;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using System.Data;
using System.Reflection;
using System.Text.Json;
using GuardAuth = angnet.Utility.CommonUtils.CheckAuthorized;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;


namespace angnet.Infrastructure.Data.Repositories
{
    public class MstDistrictRespository : BaseRepository<MstDistrictModel>, IMstDistrictRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        public MstDistrictRespository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor) : base(appDbContext, httpContextAccessor)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
        }

        public (List<MstDistrictModel> Data, int TotalCount) Search(
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