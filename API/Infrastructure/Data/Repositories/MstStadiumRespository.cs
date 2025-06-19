using Microsoft.EntityFrameworkCore;
using System.Data;
using GuardAuth = API.Shared.Utilities.CheckAuthorized;
using SharedModels.Dtos;
using SharedModels.Models;
using TCommonUtils = CommonUtils.CommonUtils.CommonUtils;
using API.Application.Interfaces.Repositories;
using API.Infrastructure.Data;

namespace API.Infrastructure.Data.Repositories
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
