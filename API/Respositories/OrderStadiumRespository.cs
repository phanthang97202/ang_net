using API.Data;
using API.IRespositories;
using API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using GuardAuth = API.Middlewares.CheckAuthorized;
using TCommonUtils = CommonUtils.CommonUtils.CommonUtils;
using TConstValue = CommonUtils.CommonUtils.ConstValue;
using SharedModels.Dtos;
using SharedModels.Models;
using Dapper;
using Microsoft.Data.Sqlite;

namespace API.Respositories
{
    public class OrderStadiumRespository
    {
    }
}
