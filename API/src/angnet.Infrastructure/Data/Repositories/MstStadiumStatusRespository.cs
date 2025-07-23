using Microsoft.EntityFrameworkCore;
using System.Data;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using GuardAuth = angnet.Utility.CommonUtils.CheckAuthorized;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;
using angnet.Application.Interfaces.Repositories;
using angnet.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace angnet.Infrastructure.Data.Repositories
{
    public class MstStadiumStatusRespository : BaseRepository<MstStadiumStatusModel>, IMstStadiumStatusRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        public MstStadiumStatusRespository(
                AppDbContext appDbContext
                , IHttpContextAccessor httpContextAccessor
            ) : base(appDbContext, httpContextAccessor)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
        }
    }
}
