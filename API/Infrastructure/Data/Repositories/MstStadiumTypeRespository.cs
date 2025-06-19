using Microsoft.EntityFrameworkCore;
using System.Data;
using GuardAuth = API.Shared.Utilities.CheckAuthorized;
using TCommonUtils = CommonUtils.CommonUtils.CommonUtils;
using SharedModels.Dtos;
using SharedModels.Models;
using API.Application.Interfaces.Repositories;
using API.Infrastructure.Data;
using API.Infrastructure.Data.Services;

namespace API.Infrastructure.Data.Repositories
{
    public class MstStadiumTypeRespository : BaseRepository<MstStadiumTypeModel>, IMstStadiumTypeRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        public MstStadiumTypeRespository(
                AppDbContext appDbContext
                , IHttpContextAccessor httpContextAccessor
            ) : base(appDbContext, httpContextAccessor)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
        }
    }
}
