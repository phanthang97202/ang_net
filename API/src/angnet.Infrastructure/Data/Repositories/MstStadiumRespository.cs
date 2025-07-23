using Microsoft.EntityFrameworkCore;
using System.Data;
using GuardAuth = angnet.Utility.CommonUtils.CheckAuthorized;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;
using angnet.Application.Interfaces.Repositories;
using angnet.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;


namespace angnet.Infrastructure.Data.Repositories
{
    public class MstStadiumRespository : BaseRepository<MstStadiumModel>, IMstStadiumRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        public MstStadiumRespository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor) : base(appDbContext, httpContextAccessor)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
        }
    }
}
