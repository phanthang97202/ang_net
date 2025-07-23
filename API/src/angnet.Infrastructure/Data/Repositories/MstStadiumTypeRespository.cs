using Microsoft.EntityFrameworkCore;
using System.Data;
using GuardAuth = angnet.Utility.CommonUtils.CheckAuthorized;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using angnet.Application.Interfaces.Repositories;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace angnet.Infrastructure.Data.Repositories
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
