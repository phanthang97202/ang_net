using Microsoft.EntityFrameworkCore;
using System.Data;
using SharedModels.Dtos;
using SharedModels.Models;
using GuardAuth = API.Shared.Utilities.CheckAuthorized;
using TCommonUtils = CommonUtils.CommonUtils.CommonUtils;
using API.Application.Interfaces.Repositories;
using API.Infrastructure.Data;

namespace API.Infrastructure.Data.Repositories
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
